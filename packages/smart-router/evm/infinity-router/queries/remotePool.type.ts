import type { Address } from 'viem/accounts'
import { SerializedBinReserves, SerializedTick } from '../../v3-router/utils/transformer'

export interface RemotePoolBase {
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
export interface RemotePoolCL extends RemotePoolBase {
  liquidity: string
  sqrtPrice: string
  tick: number
  ticks?: SerializedTick[]
  tickSpacing: number
}

export interface RemotePoolBIN extends RemotePoolBase {
  binStep: number
  activeId: number
  reserveOfBin?: Record<number, SerializedBinReserves>
}

export interface RemoteToken {
  id: Address
  decimals: number
  symbol: string
}
