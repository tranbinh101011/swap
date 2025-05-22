import { ChainId } from '@pancakeswap/chains'
import { Protocol } from '@pancakeswap/farms'
import { InfinityRouter, Pool, SmartRouter, V2Pool, V3Pool } from '@pancakeswap/smart-router'
import { cacheByLRU } from '@pancakeswap/utils/cacheByLRU'
import { Tick } from '@pancakeswap/v3-sdk'
import { POOLS_FAST_REVALIDATE } from 'config/pools'
import { getPoolTicks } from 'hooks/useAllTicksQuery'
import memoize from 'lodash/memoize'
import { PoolQuery, PoolQueryOptions } from 'quoter/quoter.types'
import { v2Clients, v3Clients } from 'utils/graphql'
import { getViemClients } from 'utils/viem'
import { FetchCandidatePoolsError } from './FetchCandidatePoolsError'
import { PoolHashHelper } from './PoolHashHelper'

export const poolQueriesFactory = memoize((chainId: ChainId) => {
  const POOL_TTL = POOLS_FAST_REVALIDATE[chainId] || 10_000
  function getCacheKey(args: [PoolQuery, PoolQueryOptions] | [PoolQuery]) {
    const hash = PoolHashHelper.hashPoolQuery(args[0])
    return hash
  }

  function isValid(result: Pool[]) {
    return result && result.length > 0
  }

  const cacheOption = {
    ttl: POOL_TTL,
    key: getCacheKey,
    isValid,
    maxAge: 30_000,
  }

  const getV2CandidatePools = cacheByLRU(async (query: PoolQuery, options: PoolQueryOptions) => {
    const { currencyA, currencyB } = query

    const call = async () => {
      const provider = options.provider ?? getViemClients
      const pools = await SmartRouter.getV2CandidatePools({
        currencyA,
        currencyB,
        v2SubgraphProvider: ({ chainId }) => (chainId ? v2Clients[chainId] : undefined),
        v3SubgraphProvider: ({ chainId }) => (chainId ? v3Clients[chainId] : undefined),
        onChainProvider: provider,
      })
      return pools as V2Pool[]
    }
    return call()
  }, cacheOption)

  const getV3CandidatePools = cacheByLRU(async (query: PoolQuery, options: PoolQueryOptions) => {
    const call = async () => {
      const pools = await getV3CandidatePoolsWithoutTicks(query, options)
      return fillV3Ticks(pools)
    }

    return call()
  }, cacheOption)

  const getV3CandidatePoolsWithoutTicks = cacheByLRU(async (query: PoolQuery, options: PoolQueryOptions) => {
    const { currencyA, currencyB, blockNumber } = query
    const call = async () => {
      const provider = options.provider ?? getViemClients
      return SmartRouter.getV3CandidatePools({
        currencyA,
        currencyB,
        subgraphProvider: ({ chainId }) => (chainId ? v3Clients[chainId] : undefined),
        onChainProvider: provider,
        blockNumber,
      })
    }
    return call()
  }, cacheOption)

  const getV3PoolsWithTicksOnChain = cacheByLRU(async (query: PoolQuery, options: PoolQueryOptions) => {
    const call = async () => {
      const provider = options.provider ?? getViemClients

      const res = await InfinityRouter.getV3CandidatePools({
        currencyA: query.currencyA,
        currencyB: query.currencyB,
        clientProvider: provider,
        gasLimit: options?.gasLimit,
      })
      return res
    }
    return call()
  }, cacheOption)

  const fillV3Ticks = async (pools: V3Pool[]) => {
    const poolTicks = await Promise.all(
      pools.map(async (pool) => {
        const data = await getPoolTicks({
          chainId: pool.token0.chainId,
          poolAddress: SmartRouter.getPoolAddress(pool),
          protocol: Protocol.V3,
        })
        return data.map(
          ({ tick, liquidityNet, liquidityGross }) => new Tick({ index: Number(tick), liquidityNet, liquidityGross }),
        )
      }),
    )
    return pools?.map((pool, i) => ({
      ...pool,
      ticks: poolTicks[i],
    }))
  }

  const getInfinityCandidatePoolsLight = cacheByLRU(async (query: PoolQuery, options: PoolQueryOptions) => {
    const { currencyA, currencyB } = query
    const call = async () => {
      const provider = options.provider ?? getViemClients
      const pools = await InfinityRouter.getInfinityCandidatePoolsLite({
        currencyA,
        currencyB,
        clientProvider: provider,
      })
      return pools
    }

    return call()
  }, cacheOption)

  const getInfinityCandidatePools = cacheByLRU(async (query: PoolQuery, options: PoolQueryOptions) => {
    const { currencyA, currencyB, blockNumber } = query

    const call = async () => {
      const provider = options.provider ?? getViemClients
      const pools = await InfinityRouter.getInfinityCandidatePools({
        currencyA,
        currencyB,
        clientProvider: provider,
      })

      return pools
    }

    return call()
  }, cacheOption)

  const getStableSwapPools = cacheByLRU(async (query: PoolQuery, options: PoolQueryOptions) => {
    const { currencyA, currencyB, blockNumber } = query

    const call = async () => {
      const provider = options.provider ?? getViemClients
      const resolvedPairs = await SmartRouter.getPairCombinations(currencyA, currencyB)
      const pools = await SmartRouter.getStablePoolsOnChain(resolvedPairs ?? [], provider, blockNumber)
      return pools
    }

    return call()
  }, cacheOption)

  return {
    getV2CandidatePools,
    getV3CandidatePools,
    getV3CandidatePoolsWithoutTicks,
    getV3PoolsWithTicksOnChain,
    getInfinityCandidatePoolsLight,
    getInfinityCandidatePools,
    getStableSwapPools,
  }
})

export const fetchCandidatePools = async (query: PoolQuery, options: PoolQueryOptions) => {
  const { chainId, currencyA, currencyB, blockNumber } = query
  const queries = poolQueriesFactory(chainId)
  if (!currencyA || !currencyB || !chainId || !blockNumber) {
    return []
  }
  const call = async () => {
    const poolsArray = await Promise.all([
      options.stableSwap ? queries.getStableSwapPools(query, options) : ([] as Pool[]),
      options.v2Pools ? queries.getV2CandidatePools(query, options) : ([] as Pool[]),
      options.v3Pools ? queries.getV3PoolsWithTicksOnChain(query, options) : ([] as Pool[]),
      options.infinity ? queries.getInfinityCandidatePools(query, options) : ([] as Pool[]),
    ])
    return poolsArray.flat() as Pool[]
  }

  try {
    return await call()
  } catch (ex) {
    console.warn(ex)
    throw new FetchCandidatePoolsError('fetchCommonPoolsOnChain')
  }
}

export const fetchCandidatePoolsLite = async (query: PoolQuery, options: PoolQueryOptions) => {
  const { chainId, currencyA, currencyB, blockNumber } = query
  const queries = poolQueriesFactory(chainId)
  if (!currencyA || !currencyB || !chainId || !blockNumber) {
    return []
  }

  const call = async () => {
    const poolsArray = await Promise.all([
      options.stableSwap ? queries.getStableSwapPools(query, options) : ([] as Pool[]),
      options.v2Pools ? queries.getV2CandidatePools(query, options) : ([] as Pool[]),
      options.v3Pools ? queries.getV3CandidatePoolsWithoutTicks(query, options) : ([] as Pool[]),
      options.infinity ? queries.getInfinityCandidatePoolsLight(query, options) : ([] as Pool[]),
    ])
    return poolsArray.flat() as Pool[]
  }

  try {
    return await call()
  } catch (ex) {
    console.warn(ex)
    throw new FetchCandidatePoolsError('commonPoolsLiteAtom')
  }
}

const protocolsFromQuery = (query: PoolQueryOptions) => {
  const protocols: string[] = []
  if (query.stableSwap) {
    protocols.push('ss')
  }
  if (query.v2Pools) {
    protocols.push('v2')
  }
  if (query.v3Pools) {
    protocols.push('v3')
  }
  if (query.infinity) {
    protocols.push('infinity')
  }
  return protocols
}
