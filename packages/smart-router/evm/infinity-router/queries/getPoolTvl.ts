import { ChainId, getChainName } from '@pancakeswap/chains'
import { cacheByLRU } from '@pancakeswap/utils/cacheByLRU'
import { InfinityBinPool, InfinityClPool } from '../../v3-router/types'
import { GetInfinityCandidatePoolsParams } from '../types'

export interface InfinityPoolTvlReference extends Pick<InfinityClPool | InfinityBinPool, 'id'> {
  tvlUSD: bigint | string
}

export type InfinityPoolTvlReferenceMap = Record<`0x${string}`, InfinityPoolTvlReference>

const fetchAllPoolsTVL = cacheByLRU(
  async (chainId: ChainId) => {
    const chainName = getChainName(chainId)
    const url = `/api/infinity/pools?chain=${chainName}&protocol=infinityCl&protocol=infinityBin`
    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`Failed to get infinity pools tvl reference. ${res.statusText}`)
    }
    const resp = await res.json()
    const refs: InfinityPoolTvlReference[] = resp.data
    const map: InfinityPoolTvlReferenceMap = {}
    for (const ref of refs) {
      map[ref.id] = ref
    }
    return map
  },
  {
    ttl: 10_000,
    maxCacheSize: 100,
  },
)

export const getInfinityTvlReference = (params: GetInfinityCandidatePoolsParams) => {
  return fetchAllPoolsTVL(params.currencyA!.chainId)
}

export const getInfinityPoolTvl = (map: InfinityPoolTvlReferenceMap, poolId: `0x${string}`) => {
  const ref = map[poolId]
  const tvlUsd = BigInt(ref ? ref.tvlUSD : 0n)
  return tvlUsd
}
