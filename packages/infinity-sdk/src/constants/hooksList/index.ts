import { ChainId } from '@pancakeswap/chains'
import { bscDynamicHooks, bscHooksList } from './bsc'
import { bscTestnetDynamicHooks, bscTestnetHooksList } from './bscTestnet'

export const hooksList = {
  [ChainId.BSC]: bscHooksList,
  [ChainId.BSC_TESTNET]: bscTestnetHooksList,
  [ChainId.SEPOLIA]: [],
}

export const dynamicHooksList = {
  [ChainId.BSC]: bscDynamicHooks,
  [ChainId.BSC_TESTNET]: bscTestnetDynamicHooks,
  [ChainId.SEPOLIA]: [],
}

export function findHook(hook: string, chainId: ChainId) {
  const list = hooksList[chainId as keyof typeof hooksList]
  return list.find((x) => x.address === hook)
}

export * from './dynamicFeeHook'
