import { ChainId, getChainName } from '@pancakeswap/chains'
import {
  encodeHooksRegistration,
  hooksList,
  INFI_BIN_POOL_MANAGER_ADDRESSES,
  INFI_CL_POOL_MANAGER_ADDRESSES,
} from '@pancakeswap/infinity-sdk'
import { Currency, getCurrencyAddress } from '@pancakeswap/swap-sdk-core'
import { cacheByLRU } from '@pancakeswap/utils/cacheByLRU'
import { Address, checksumAddress } from 'viem'
import { infinityPoolTvlSelector } from '../../v3-router/providers'
import {
  BaseInfinityPool,
  InfinityBinPool,
  InfinityClPool,
  InfinityPoolWithTvl,
  PoolType,
  WithTvl,
} from '../../v3-router/types'
import { parseCurrency } from '../../v3-router/utils/transformer'
import { GetInfinityCandidatePoolsParams } from '../types'
import { fillPoolsWithBins, getInfinityBinCandidatePoolsWithoutBins } from './getInfinityBinPools'
import { fillClPoolsWithTicks, getInfinityClCandidatePoolsWithoutTicks } from './getInfinityClPools'
import { getInfinityPoolTvl, getInfinityTvlReference } from './getPoolTvl'

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
  const [clPools, binPools, tvlMap] = await Promise.all([
    getInfinityClCandidatePoolsWithoutTicks(params),
    getInfinityBinCandidatePoolsWithoutBins(params),
    getInfinityTvlReference(params),
  ])
  const pools = [...clPools, ...binPools]
  const poolsWithTvl: InfinityPoolWithTvl[] = pools.map((pool) => {
    return {
      ...pool,
      tvlUSD: getInfinityPoolTvl(tvlMap, pool.id),
    } as InfinityPoolWithTvl
  })
  return poolsWithTvl
}

const fetchPoolsApi = cacheByLRU(
  async (params: GetInfinityCandidatePoolsParams) => {
    const { currencyA, currencyB } = params
    const chain = getChainName(currencyA!.chainId)
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
  try {
    const result = await fetchPoolsApi(params)
    return result
  } catch (ex) {
    console.warn(ex)
    return fetchPoolsOnChain(params)
  }
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
  const filtered = data.map((pool) => parsePool(pool, currencyA.chainId as keyof typeof hooksList)).filter((x) => x)
  return filtered as (InfinityClPool | InfinityBinPool)[]
}

interface RemotePoolBase {
  id: Address
  feeTier: number
  protocolFee: number
  token0: RemoteToken
  token1: RemoteToken
  totalVolumeUSD: string
  tvlUSD: string
  hookAddress?: Address
  isDynamicFee: boolean
  protocol: 'infinityCl' | 'infinityBin'
}
interface RemotePoolCL extends RemotePoolBase {
  liquidity: string
  sqrtPrice: string
  tick: number
}

interface RemotePoolBIN extends RemotePoolBase {
  binStep: number
  activeId: number
}

interface RemoteToken {
  id: Address
  decimals: number
  symbol: string
}
function getValidToken(chainId: ChainId, token: RemoteToken): Currency {
  try {
    const raw = {
      address: checksumAddress(token.id),
      decimals: token.decimals,
      symbol: token.symbol,
    }
    return parseCurrency(chainId, raw)
  } catch (ex) {
    console.warn('invalid token', token, ex)
    throw ex
  }
}

function normalizeTvlUSD(tvlUSD: string) {
  const val = Number(tvlUSD)
  return Number.isFinite(val) ? Math.ceil(val).toString() : '0'
}

function parsePool(remote: RemotePoolCL | RemotePoolBIN, chainId: keyof typeof hooksList) {
  const { id, protocol, feeTier, protocolFee, hookAddress, tvlUSD } = remote

  const type = protocol === 'infinityCl' ? PoolType.InfinityCL : PoolType.InfinityBIN
  const relatedHook = hooksList[chainId].find((hook) => hook.address.toLowerCase() === hookAddress?.toLocaleLowerCase())

  const currency0 = getValidToken(chainId, remote.token0)
  const currency1 = getValidToken(chainId, remote.token1)
  const bnTvlUsd = BigInt(normalizeTvlUSD(tvlUSD))

  const pool: BaseInfinityPool & WithTvl = {
    id: checksumAddress(id),
    type,
    fee: feeTier,
    protocolFee,
    hooks: hookAddress ? checksumAddress(hookAddress) : undefined,
    hooksRegistrationBitmap: relatedHook ? encodeHooksRegistration(relatedHook.hooksRegistration) : undefined,
    poolManager:
      type === PoolType.InfinityCL ? INFI_CL_POOL_MANAGER_ADDRESSES[chainId] : INFI_BIN_POOL_MANAGER_ADDRESSES[chainId],
    currency0,
    currency1,
    tvlUSD: bnTvlUsd,
  }

  if (pool.type === PoolType.InfinityCL) {
    const remoteClPool = remote as RemotePoolCL
    if (!remoteClPool.feeTier || !remoteClPool.tick) {
      return null
    }

    return {
      ...pool,
      type: PoolType.InfinityCL,
      liquidity: BigInt(remoteClPool.liquidity),
      sqrtRatioX96: BigInt(remoteClPool.sqrtPrice),
      tick: remoteClPool.tick,
      tickSpacing: 1,
    } as InfinityClPool
  }
  if (pool.type === PoolType.InfinityBIN) {
    const removeBinPool = remote as RemotePoolBIN
    const binPool: InfinityBinPool = {
      ...pool,
      type: PoolType.InfinityBIN,
      binStep: removeBinPool.binStep,
      activeId: removeBinPool.activeId,
    }
    return binPool
  }
  throw new Error(`Unknown pool type: ${type}`)
}
