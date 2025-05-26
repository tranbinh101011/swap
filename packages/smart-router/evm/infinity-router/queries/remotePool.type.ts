import type { Address } from 'viem/accounts'
import { SerializedBinReserves, SerializedTick } from '../../v3-router/utils/transformer'

export type RemotePoolBase = {
  id: Address
  chainId: number
  tvlUSD: string
  protocol: 'v2' | 'v3' | 'infinityBin' | 'infinityCl' | 'stable'
  feeTier: number
  token0: RemoteToken
  token1: RemoteToken
  isDynamicFee?: boolean
  hookAddress?: Address | null
  protocolFee: number
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
