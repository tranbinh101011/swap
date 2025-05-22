import { ChainId, getChainName } from '@pancakeswap/chains'
import { hooksList } from '@pancakeswap/infinity-sdk'
import { Currency, getCurrencyAddress } from '@pancakeswap/swap-sdk-core'
import { cacheByLRU } from '@pancakeswap/utils/cacheByLRU'
import { infinityPoolTvlSelector } from '../../v3-router/providers'
import { InfinityBinPool, InfinityClPool, InfinityPoolWithTvl, PoolType } from '../../v3-router/types'
import { GetInfinityCandidatePoolsParams } from '../types'
import { fillPoolsWithBins, getInfinityBinCandidatePoolsWithoutBins } from './getInfinityBinPools'
import { fillClPoolsWithTicks, getInfinityClCandidatePoolsWithoutTicks } from './getInfinityClPools'
import { getInfinityPoolTvl, getInfinityTvlReference, InfinityPoolTvlReferenceMap } from './getPoolTvl'
import { RemotePoolBIN, RemotePoolCL } from './remotePool.type'
import { toLocalInfinityPool } from './remotePoolTransform'

export const getInfinityCandidatePools = async (params: GetInfinityCandidatePoolsParams) => {
  const pools = await getInfinityCandidatePoolsLite(params)
  const clPools = pools.filter((pool) => pool.type === PoolType.InfinityCL) as InfinityClPool[]
  const binPools = pools.filter((pool) => pool.type === PoolType.InfinityBIN) as InfinityBinPool[]

  const [poolWithTicks, poolWithBins] = await Promise.all([
    fillClPoolsWithTicks({
      pools: clPools,
      clientProvider: params.clientProvider,
      gasLimit: params.gasLimit,
    }),
    fillPoolsWithBins({
      pools: binPools,
      clientProvider: params.clientProvider,
      gasLimit: params.gasLimit,
    }),
  ])
  return [...poolWithTicks, ...poolWithBins]
}

async function fetchPoolsOnChain(params: GetInfinityCandidatePoolsParams) {
  const isTestnet = params.currencyA?.chainId === ChainId.BSC_TESTNET
  const [clPools, binPools, tvlMap] = await Promise.all([
    getInfinityClCandidatePoolsWithoutTicks(params),
    getInfinityBinCandidatePoolsWithoutBins(params),
    isTestnet ? ({} as InfinityPoolTvlReferenceMap) : getInfinityTvlReference(params),
  ])
  const pools = [...clPools, ...binPools]
  const poolsWithTvl: InfinityPoolWithTvl[] = pools.map((pool) => {
    return {
      ...pool,
      tvlUSD: isTestnet ? 0 : getInfinityPoolTvl(tvlMap, pool.id),
    } as InfinityPoolWithTvl
  })
  return poolsWithTvl
}

const fetchPoolsApi = cacheByLRU(
  async (params: GetInfinityCandidatePoolsParams) => {
    const { currencyA, currencyB } = params
    const chainId = currencyA?.chainId
    const chain = getChainName(chainId!)
    const pools = await fetchInfinityPoolsFromApi(currencyA!, currencyB!, chain)

    return pools as InfinityPoolWithTvl[]
  },
  {
    ttl: 5_000,
    key: (args) => {
      const params = args[0]
      const chainId = params.currencyA?.chainId
      return [
        chainId,
        getCurrencyAddress(params.currencyA!),
        getCurrencyAddress(params.currencyB!),
        params.currencyA?.chainId,
        params.currencyB?.chainId,
      ]
    },
  },
)

async function fetchPools(params: GetInfinityCandidatePoolsParams) {
  const chainId = params.currencyA?.chainId
  const isTestnet = chainId === ChainId.BSC_TESTNET
  const requests = isTestnet ? [fetchPoolsOnChain] : [fetchPoolsApi, fetchPoolsOnChain]

  for (const requestFN of requests) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const pools = await requestFN(params)
      if (pools.length > 0) {
        return pools
      }
    } catch (error) {
      console.warn(`Error fetching infinity pools from ${requestFN.name}:`, error)
    }
  }
  throw new Error('No pools found')
}

export const getInfinityCandidatePoolsLite = async (
  params: GetInfinityCandidatePoolsParams,
): Promise<(InfinityClPool | InfinityBinPool)[]> => {
  const pools = await fetchPools(params)
  const filtered = infinityPoolTvlSelector(params.currencyA, params.currencyB, pools)
  return filtered as (InfinityClPool | InfinityBinPool)[]
}

async function fetchInfinityPoolsFromApi(currencyA: Currency, currencyB: Currency, chainName: string) {
  // https://explorer-api-svvg8.ondigitalocean.app/cached/pools/candidates/infinity/bsc/
  const addressA = getCurrencyAddress(currencyA)
  const addressB = getCurrencyAddress(currencyB)
  const url = `${process.env.NEXT_PUBLIC_EXPLORE_API_ENDPOINT}/cached/pools/candidates/infinity/${chainName}/${addressA}/${addressB}`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Error fetching infinity pools: ${response.statusText}`)
  }
  const data = (await response.json()) as (RemotePoolCL | RemotePoolBIN)[]
  const filtered = data
    .map((pool) => toLocalInfinityPool(pool, currencyA.chainId as keyof typeof hooksList))
    .filter((x) => x)
  return filtered as (InfinityClPool | InfinityBinPool)[]
}
