import { ChainId } from '@pancakeswap/chains'
import {
  encodeHooksRegistration,
  hooksList,
  INFI_BIN_POOL_MANAGER_ADDRESSES,
  INFI_CL_POOL_MANAGER_ADDRESSES,
} from '@pancakeswap/infinity-sdk'

import { Currency } from '@pancakeswap/swap-sdk-core'
import { checksumAddress } from 'viem'
import { Address } from 'viem/accounts'
import { BaseInfinityPool, InfinityBinPool, InfinityClPool, PoolType, WithTvl } from '../../v3-router/types'
import {
  parseBinPoolBinReserves,
  parseCurrency,
  parseTick,
  serializeBinPoolBinReserves,
  serializeTick,
} from '../../v3-router/utils/transformer'
import { RemotePoolBase, RemotePoolBIN, RemotePoolCL, RemoteToken } from './remotePool.type'

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

export function toLocalInfinityPool(remote: RemotePoolCL | RemotePoolBIN, chainId: keyof typeof hooksList) {
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

    return {
      ...pool,
      type: PoolType.InfinityCL,
      sqrtRatioX96: BigInt(remoteClPool.sqrtPrice),
      tick: remoteClPool.tick,
      ticks: remoteClPool.ticks ? remoteClPool.ticks.map((x) => parseTick(x)) : [],
      tickSpacing: Number(remoteClPool.tickSpacing),
      liquidity: BigInt(remoteClPool.liquidity),
    } as InfinityClPool
  }
  if (pool.type === PoolType.InfinityBIN) {
    const removeBinPool = remote as RemotePoolBIN
    const binPool: InfinityBinPool = {
      ...pool,
      type: PoolType.InfinityBIN,
      binStep: removeBinPool.binStep,
      activeId: removeBinPool.activeId,
      reserveOfBin: parseBinPoolBinReserves(removeBinPool.reserveOfBin),
    }
    return binPool
  }
  throw new Error(`Unknown pool type: ${type}`)
}

export function toRemoteInfinityPool(
  pool: (InfinityClPool & WithTvl) | (InfinityBinPool & WithTvl),
): RemotePoolCL | RemotePoolBIN {
  const base: RemotePoolBase = {
    id: pool.id,
    chainId: pool.currency0.chainId,
    feeTier: pool.fee,
    protocolFee: pool.protocolFee || 0,
    token0: {
      id: pool.currency0.wrapped.address as Address,
      decimals: pool.currency0.decimals,
      symbol: pool.currency0.symbol || '',
    },
    token1: {
      id: pool.currency1.wrapped.address as Address,
      decimals: pool.currency1.decimals,
      symbol: pool.currency1.symbol || '',
    },
    tvlUSD: pool.tvlUSD.toString(),
    hookAddress: pool.hooks as Address | undefined,
    isDynamicFee: false, // Assuming default; adjust based on your logic
    protocol: pool.type === PoolType.InfinityCL ? 'infinityCl' : 'infinityBin',
  }

  if (pool.type === PoolType.InfinityCL) {
    const ticks = pool.ticks ? pool.ticks.map((x) => serializeTick(x)) : []
    return {
      ...base,
      sqrtPrice: pool.sqrtRatioX96.toString(),
      tick: pool.tick,
      ticks,
      tickSpacing: pool.tickSpacing,
    } as RemotePoolCL
  }

  if (pool.type === PoolType.InfinityBIN) {
    const bins = serializeBinPoolBinReserves(pool.reserveOfBin)
    return {
      ...base,
      binStep: pool.binStep,
      activeId: pool.activeId,
      reserveOfBin: bins,
    } as RemotePoolBIN
  }

  throw new Error(`Unsupported pool type: ${pool}`)
}
