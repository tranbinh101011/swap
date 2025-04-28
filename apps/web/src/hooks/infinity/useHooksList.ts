import { ChainId } from '@pancakeswap/chains'
import { type HookData, HookType, type PoolType, dynamicHooksList, hooksList } from '@pancakeswap/infinity-sdk'
import keyBy from 'lodash/keyBy'
import { useMemo } from 'react'
import { Address } from 'viem'
import { usePoolKeyByPoolId } from './usePoolKeyByPoolId'

export const useHooksList = (chainId?: ChainId, poolType?: PoolType): HookData[] => {
  return useMemo(() => {
    if (!chainId) {
      return []
    }
    const list = hooksList[chainId] as HookData[] | undefined
    if (!list) {
      return []
    }
    if (!poolType) {
      return list
    }
    return list.filter((h) => h.poolType === poolType && h.hookType !== HookType.PerPool)
  }, [chainId, poolType])
}

export const useHooksMap = (chainId?: ChainId) => {
  const list = useHooksList(chainId)
  return useMemo(() => keyBy(list, 'address'), [list])
}

export const useHookByAddress = (chainId?: ChainId, address?: HookData['address']): HookData | undefined => {
  const hooksMap = useHooksMap(chainId)
  return useMemo(() => (address ? hooksMap[address] : undefined), [hooksMap, address])
}

export const useHookByPoolId = (chainId?: ChainId, poolId?: Address): HookData | undefined => {
  const { data: poolKey } = usePoolKeyByPoolId(poolId, chainId)
  const hooksMap = useHooksMap(chainId)

  return useMemo(() => (poolKey?.hooks ? hooksMap[poolKey.hooks] : undefined), [hooksMap, poolKey?.hooks])
}

export const useDefaultDynamicHook = (chainId?: ChainId, poolType?: PoolType) =>
  useMemo(
    () => (chainId && dynamicHooksList[chainId] ? dynamicHooksList[chainId][poolType] : undefined),
    [chainId, poolType],
  )
