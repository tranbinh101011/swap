import { ChainId } from '@pancakeswap/chains'
import { InfinityBinPool, InfinityClPool, SmartRouter, StablePool, V2Pool, V3Pool } from '@pancakeswap/smart-router'

import { Currency, getCurrencyAddress } from '@pancakeswap/swap-sdk-core'
import { cacheByLRU } from '@pancakeswap/utils/cacheByLRU'
import qs from 'qs'
import { PoolHashHelper } from './PoolHashHelper'
import { Protocol } from './edgeQueries.util'

const _fetchPools = async function <T>(
  currencyA: Currency,
  currencyB: Currency,
  chainId: ChainId,
  protocols: Protocol[],
  signal?: AbortSignal,
): Promise<T> {
  const addressA = getCurrencyAddress(currencyA)
  const addressB = getCurrencyAddress(currencyB)
  const query = qs.stringify({
    addressA,
    addressB,
    chainId,
    protocol: protocols.join(','),
  })

  const queryApi = async () => {
    const res = await fetch(`/api/pools/candidates?${query}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal,
    })

    if (!res.ok) {
      throw new Error(`Failed to fetch pools: ${await res.text()}`)
    }
    return res.json()
  }

  const json = (await queryApi()) as {
    lastUpdated: number
    data: T
  }

  return json.data
}

const getV2CandidatePools = async (currencyA: Currency, currencyB: Currency, chainId: ChainId, abort?: AbortSignal) => {
  const pools = await fetchPools<SmartRouter.Transformer.SerializedV2Pool[]>(
    currencyA,
    currencyB,
    chainId,
    ['v2'],
    abort,
  )
  return pools.map((pool) => SmartRouter.Transformer.parsePool(chainId, pool) as V2Pool)
}

const getV3CandidatePools = async (
  currencyA: Currency,
  currencyB: Currency,
  chainId: ChainId,
  blockNumber: number,
  abortSignal?: AbortSignal,
) => {
  const pools = await fetchPools<SmartRouter.Transformer.SerializedV3Pool[]>(
    currencyA,
    currencyB,
    chainId,
    ['v3'],
    abortSignal,
  )
  return pools.map((pool) => SmartRouter.Transformer.parsePool(chainId, pool) as V3Pool)
}

const getSSCandidatePools = async (
  currencyA: Currency,
  currencyB: Currency,
  chainId: ChainId,
  abortSignal?: AbortSignal,
) => {
  const pools = await fetchPools<SmartRouter.Transformer.SerializedStablePool[]>(
    currencyA,
    currencyB,
    chainId,
    ['stable'],
    abortSignal,
  )
  return pools.map((pool) => SmartRouter.Transformer.parsePool(chainId, pool) as StablePool)
}

const getInfinityCandidatePools = async (
  currencyA: Currency,
  currencyB: Currency,
  chainId: ChainId,
  abortSignal?: AbortSignal,
) => {
  const pools = await fetchPools<
    (SmartRouter.Transformer.SerializedInfinityBinPool | SmartRouter.Transformer.SerializedInfinityClPool)[]
  >(currencyA, currencyB, chainId, ['infinityCl', 'infinityBin'], abortSignal)
  const filtered = pools.map((pool) => SmartRouter.Transformer.parsePool(chainId, pool))
  return filtered as (InfinityClPool | InfinityBinPool)[]
}

const fetchPools = cacheByLRU(_fetchPools, {
  ttl: 3_000,
  key: (args) => {
    const [currencyA, currencyB, chainId, protocol] = args
    const hashc = PoolHashHelper.hashCurrenciesWithSort(currencyA, currencyB)
    return `${hashc}-${chainId}-${protocol.join(',')}`
  },
  usingStaleValue: false,
})

const getAllCandidates = async (
  currencyA: Currency,
  currencyB: Currency,
  chainId: ChainId,
  blockNumber: number,
  protocols: string[],
  abortSignal?: AbortSignal,
) => {
  const pools = await fetchPools<SmartRouter.Transformer.SerializedPool[]>(
    currencyA,
    currencyB,
    chainId,
    protocols as Protocol[],
    abortSignal,
  )
  return pools.map((pool) => {
    return SmartRouter.Transformer.parsePool(chainId, pool)
  })
}

export const edgePoolQueryClient = {
  getAllCandidates,
  getV2CandidatePools,
  getV3CandidatePools,
  getSSCandidatePools,
  getInfinityCandidatePools,
}
