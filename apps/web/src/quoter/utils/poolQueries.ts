import { ChainId } from '@pancakeswap/chains'
import { Protocol } from '@pancakeswap/farms'
import { InfinityRouter, Pool, SmartRouter, V3Pool } from '@pancakeswap/smart-router'
import { cacheByLRU } from '@pancakeswap/utils/cacheByLRU'
import { Tick } from '@pancakeswap/v3-sdk'
import { POOLS_FAST_REVALIDATE } from 'config/pools'
import { getPoolTicks } from 'hooks/useAllTicksQuery'
import memoize from 'lodash/memoize'
import { PoolQuery } from 'quoter/quoter.types'
import { v2Clients, v3Clients } from 'utils/graphql'
import { createViemPublicClientGetter, getViemClients } from 'utils/viem'
import { PoolHashHelper } from './PoolHashHelper'

export const poolQueriesFactory = memoize((chainId: ChainId) => {
  const POOL_TTL = POOLS_FAST_REVALIDATE[chainId] || 10_000
  function getCacheKey(args: [PoolQuery]) {
    const query: PoolQuery = { ...args[0], quoteHash: '', infinity: false, v2Pools: false, v3Pools: false, for: '' }
    const hash = PoolHashHelper.hashPoolQuery(query)
    return hash
  }

  function createRevalidateKey(id: string) {
    return function getRevalidateKey(args: [PoolQuery]) {
      return [id, args[0].for].join('/')
    }
  }
  function isValid(result: Pool[]) {
    return result && result.length > 0
  }

  const _getV2CandidatePools = cacheByLRU(
    async (query: PoolQuery) => {
      const { currencyA, currencyB } = query
      const provider = query.provider ?? getViemClients
      const pools = await SmartRouter.getV2CandidatePools({
        currencyA,
        currencyB,
        v2SubgraphProvider: ({ chainId }) => (chainId ? v2Clients[chainId] : undefined),
        v3SubgraphProvider: ({ chainId }) => (chainId ? v3Clients[chainId] : undefined),
        onChainProvider: provider,
      })
      return pools
    },
    {
      ttl: POOL_TTL,
      autoRevalidate: {
        key: createRevalidateKey('getV2CandidatePools'),
        interval: POOL_TTL,
      },
      key: getCacheKey,
      isValid,
      maxAge: 30_000,
    },
  )
  const getV2CandidatePools = async (query: PoolQuery) => {
    if (!query.v2Pools) {
      return []
    }
    return _getV2CandidatePools(query)
  }

  const _getV3CandidatePools = cacheByLRU(
    async (options: PoolQuery) => {
      const pools = await getV3CandidatePoolsWithoutTicks(options)
      return fillV3Ticks(pools)
    },
    {
      ttl: POOL_TTL,
      autoRevalidate: {
        key: createRevalidateKey('getV3CandidatePools'),
        interval: POOL_TTL,
      },
      key: getCacheKey,
      isValid,
      maxAge: 30_000,
    },
  )
  const getV3CandidatePools = async (options: PoolQuery) => {
    if (!options.v3Pools) {
      return []
    }
    return _getV3CandidatePools(options)
  }

  const _getV3CandidatePoolsWithoutTicks = cacheByLRU(
    async (options: PoolQuery) => {
      const provider = options.provider ?? getViemClients

      const { currencyA, currencyB } = options
      return SmartRouter.getV3CandidatePools({
        currencyA,
        currencyB,
        subgraphProvider: ({ chainId }) => (chainId ? v3Clients[chainId] : undefined),
        onChainProvider: provider,
        blockNumber: options?.options?.blockNumber,
      })
    },
    {
      ttl: POOL_TTL,
      autoRevalidate: {
        key: createRevalidateKey('getV3CandidatePoolsWithoutTicks'),
        interval: POOL_TTL,
      },
      key: getCacheKey,
      isValid,
      maxAge: 30_000,
    },
  )

  const getV3CandidatePoolsWithoutTicks = async (options: PoolQuery) => {
    if (!options.v3Pools) {
      return [] as V3Pool[]
    }
    return _getV3CandidatePoolsWithoutTicks(options)
  }

  const _getV3PoolsWithTicksOnChain = cacheByLRU(
    async (query: PoolQuery) => {
      if (!query.v3Pools) {
        return []
      }

      const provider = query.provider ?? getViemClients

      const res = await InfinityRouter.getV3CandidatePools({
        currencyA: query.currencyA,
        currencyB: query.currencyB,
        clientProvider: provider,
        gasLimit: query.options?.gasLimit,
      })
      return res
    },
    {
      ttl: POOL_TTL,
      key: getCacheKey,
      autoRevalidate: {
        key: createRevalidateKey('getV3PoolsWithTicksOnChain'),
        interval: POOL_TTL,
      },
      isValid,
      maxAge: 30_000,
    },
  )

  const getV3PoolsWithTicksOnChain = async (query: PoolQuery) => {
    if (!query.v3Pools) {
      return []
    }
    return _getV3PoolsWithTicksOnChain(query)
  }

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

  const _getInfinityBinCandidatePools = cacheByLRU(
    async (query: PoolQuery) => {
      const provider = query.provider ?? getViemClients

      const pools = await InfinityRouter.getInfinityBinCandidatePools({
        currencyA: query.currencyA,
        currencyB: query.currencyB,
        clientProvider: provider,
      })
      return pools
    },
    {
      ttl: POOL_TTL,
      key: getCacheKey,
      isValid,
    },
  )

  const getInfinityBinCandidatePools = async (query: PoolQuery) => {
    if (!query.infinity) {
      return []
    }

    return _getInfinityBinCandidatePools(query)
  }

  const _getInfinityBinCandidatePoolsWithoutBins = cacheByLRU(
    async (query: PoolQuery) => {
      const provider = query.provider ?? getViemClients

      const pools = await InfinityRouter.getInfinityBinCandidatePoolsWithoutBins({
        currencyA: query.currencyA,
        currencyB: query.currencyB,
        clientProvider: provider,
      })
      return pools
    },
    {
      ttl: POOL_TTL,
      autoRevalidate: {
        key: createRevalidateKey('getInfinityBinCandidatePoolsWithoutBins'),
        interval: POOL_TTL,
      },
      key: getCacheKey,
      isValid,
      maxAge: 30_000,
    },
  )

  const getInfinityBinCandidatePoolsWithoutBins = async (query: PoolQuery) => {
    if (!query.infinity) {
      return []
    }
    return _getInfinityBinCandidatePoolsWithoutBins(query)
  }

  const _getInfinityClCandidatePools = cacheByLRU(
    async (query: PoolQuery) => {
      const provider = query.provider ?? getViemClients
      const { currencyA, currencyB } = query
      const pools = await InfinityRouter.getInfinityClCandidatePools({
        currencyA,
        currencyB,
        clientProvider: provider,
      })
      return pools
    },
    {
      ttl: POOL_TTL,
      autoRevalidate: {
        key: createRevalidateKey('getInfinityClCandidatePools'),
        interval: POOL_TTL,
      },
      key: getCacheKey,
      isValid,
      maxAge: 30_000,
    },
  )
  const getInfinityClCandidatePools = async (query: PoolQuery) => {
    if (!query.infinity) {
      return []
    }
    return _getInfinityClCandidatePools(query)
  }

  const _getInfinityCandidatePoolsLight = cacheByLRU(
    async (query: PoolQuery) => {
      const provider = query.provider ?? getViemClients
      const { currencyA, currencyB } = query
      const pools = await InfinityRouter.getInfinityCandidatePoolsLite({
        currencyA,
        currencyB,
        clientProvider: provider,
      })
      return pools
    },
    {
      ttl: POOL_TTL,
      autoRevalidate: {
        key: createRevalidateKey('getInfinityCandidatePoolsLight'),
        interval: POOL_TTL,
      },
      key: getCacheKey,
      isValid,
      maxAge: 30_000,
    },
  )

  const getInfinityCandidatePoolsLight = async (query: PoolQuery) => {
    if (!query.infinity) {
      return []
    }
    return _getInfinityCandidatePoolsLight(query)
  }

  const _getInfinityCandidatePools = cacheByLRU(
    async (query: PoolQuery) => {
      const provider = query.provider ?? getViemClients
      const { currencyA, currencyB } = query
      const pools = await InfinityRouter.getInfinityCandidatePools({
        currencyA,
        currencyB,
        clientProvider: provider,
      })
      return pools
    },
    {
      ttl: POOL_TTL,
      key: getCacheKey,
      autoRevalidate: {
        key: createRevalidateKey('getInfinityCandidatePools'),
        interval: POOL_TTL,
      },
      isValid,
      maxAge: 30_000,
    },
  )

  const getInfinityCandidatePools = async (query: PoolQuery) => {
    if (!query.infinity) {
      return []
    }
    return _getInfinityCandidatePools(query)
  }

  const _getInfinityClCandidatePoolsWithoutTicks = cacheByLRU(
    async (query: PoolQuery) => {
      const provider = query.provider ?? getViemClients
      const { currencyA, currencyB } = query
      const pools = await InfinityRouter.getInfinityClCandidatePoolsWithoutTicks({
        currencyA,
        currencyB,
        clientProvider: provider,
      })
      return pools
    },
    {
      ttl: POOL_TTL,
      key: getCacheKey,
      autoRevalidate: {
        key: createRevalidateKey('getInfinityClCandidatePoolsWithoutTicks'),
        interval: POOL_TTL,
      },
      isValid,
      maxAge: 30_000,
    },
  )

  const getInfinityClCandidatePoolsWithoutTicks = async (query: PoolQuery) => {
    if (!query.infinity) {
      return []
    }
    return _getInfinityClCandidatePoolsWithoutTicks(query)
  }

  const _getStableSwapPools = cacheByLRU(
    async (query: PoolQuery) => {
      const getViemClients = createViemPublicClientGetter({
        transportSignal: query.signal,
      })
      const blockNumber = query?.options?.blockNumber
      const { currencyA, currencyB } = query
      const provider = query.provider ?? getViemClients
      const resolvedPairs = await SmartRouter.getPairCombinations(currencyA, currencyB)
      const pools = await SmartRouter.getStablePoolsOnChain(resolvedPairs ?? [], provider, blockNumber)
      return pools
    },
    {
      ttl: POOL_TTL,
      autoRevalidate: {
        key: createRevalidateKey('getStableSwapPools'),
        interval: POOL_TTL,
      },
      key: getCacheKey,
      isValid,
      maxAge: 30_000,
    },
  )
  const getStableSwapPools = async (query: PoolQuery) => {
    const blockNumber = query?.options?.blockNumber
    if (!blockNumber) {
      return []
    }
    return _getStableSwapPools(query)
  }

  return {
    getV2CandidatePools,
    getV3CandidatePools,
    getV3CandidatePoolsWithoutTicks,
    getV3PoolsWithTicksOnChain,
    getInfinityBinCandidatePools,
    getInfinityBinCandidatePoolsWithoutBins,
    getInfinityClCandidatePools,
    getInfinityCandidatePoolsLight,
    getInfinityCandidatePools,
    getInfinityClCandidatePoolsWithoutTicks,
    getStableSwapPools,
  }
})
