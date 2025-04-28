import { Protocol } from '@pancakeswap/farms'
import { InfinityRouter, SmartRouter, V3Pool } from '@pancakeswap/smart-router'
import { cacheByLRU } from '@pancakeswap/utils/cacheByLRU'
import { Tick } from '@pancakeswap/v3-sdk'
import { getPoolTicks } from 'hooks/useAllTicksQuery'
import { PoolQuery } from 'quoter/quoter.types'
import { v2Clients, v3Clients } from 'utils/graphql'
import { createViemPublicClientGetter, getViemClients } from 'utils/viem'
import { PoolHashHelper } from './PoolHashHelper'

const POOL_TTL = 15_000
function getCacheKey(args: [PoolQuery]) {
  const query: PoolQuery = { ...args[0], quoteHash: '' }
  const hash = PoolHashHelper.hashPoolQuery(query)
  return hash
}

export const getV2CandidatePools = cacheByLRU(
  async (query: PoolQuery) => {
    const { currencyA, currencyB } = query
    if (!query.v2Pools) {
      return []
    }
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
    key: getCacheKey,
  },
)

export const getV3CandidatePools = cacheByLRU(
  async (options: PoolQuery) => {
    if (!options.v3Pools) {
      return []
    }
    const pools = await getV3CandidatePoolsWithoutTicks(options)
    return fillV3Ticks(pools)
  },
  {
    ttl: POOL_TTL,
    key: getCacheKey,
  },
)

export const getV3CandidatePoolsWithoutTicks = cacheByLRU(
  async (options: PoolQuery) => {
    if (!options.v3Pools) {
      return [] as V3Pool[]
    }
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
    key: getCacheKey,
  },
)

export const getV3PoolsWithTicksOnChain = cacheByLRU(
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
  },
)

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

export const getInfinityBinCandidatePools = cacheByLRU(
  async (query: PoolQuery) => {
    if (!query.infinity) {
      return []
    }

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
  },
)

export const getInfinityBinCandidatePoolsWithoutBins = cacheByLRU(
  async (query: PoolQuery) => {
    if (!query.infinity) {
      return []
    }
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
    key: getCacheKey,
  },
)

export const getInfinityClCandidatePools = cacheByLRU(
  async (query: PoolQuery) => {
    if (!query.infinity) {
      return []
    }

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
    key: getCacheKey,
  },
)

export const getInfinityClCandidatePoolsWithoutTicks = cacheByLRU(
  async (query: PoolQuery) => {
    if (!query.infinity) {
      return []
    }
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
  },
)

export const getStableSwapPools = cacheByLRU(
  async (query: PoolQuery) => {
    const getViemClients = createViemPublicClientGetter({
      transportSignal: query.signal,
    })
    const blockNumber = query?.options?.blockNumber
    if (!blockNumber) {
      return []
    }
    const { currencyA, currencyB } = query
    const provider = query.provider ?? getViemClients
    const resolvedPairs = await SmartRouter.getPairCombinations(currencyA, currencyB)
    const pools = await SmartRouter.getStablePoolsOnChain(resolvedPairs ?? [], provider, blockNumber)
    return pools
  },
  {
    ttl: POOL_TTL,
    key: getCacheKey,
  },
)
