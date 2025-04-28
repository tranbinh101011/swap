import { findHook, HOOK_CATEGORY } from '@pancakeswap/infinity-sdk'
import { OrderType, PriceOrder } from '@pancakeswap/price-api-sdk'
import { PoolType } from '@pancakeswap/smart-router'
import { useMemo } from 'react'
import { Address } from 'viem'
import { isAddress } from 'viem/utils'

export const useHasDynamicHook = (order?: PriceOrder): boolean => {
  return useMemo(() => {
    if (!order?.trade || order.type !== OrderType.PCS_CLASSIC) return false
    const chainId = order.trade.inputAmount.currency.chainId
    const pools = order.trade.routes
      .map((r) => r.pools)
      .flat()
      .filter((pool) => pool.type === PoolType.InfinityBIN || pool.type === PoolType.InfinityCL)
    if (pools.length === 0) return false

    const hooks = pools.map((pool) => pool.hooks).filter((hook) => hook && isAddress(hook)) as Address[]

    return hooks.some((hook) => {
      return findHook(hook, chainId)?.category?.includes(HOOK_CATEGORY.DynamicFees) ?? false
    })
  }, [order?.trade])
}
