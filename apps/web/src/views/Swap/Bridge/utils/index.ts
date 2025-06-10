import { OrderType } from '@pancakeswap/price-api-sdk'
import { Percent } from '@pancakeswap/swap-sdk-core'
import { BridgeOrderWithCommands, isXOrder } from 'views/Swap/utils'
import { computeTradePriceBreakdown, TradePriceBreakdown } from 'views/Swap/V3Swap/utils/exchange'
import { detectHasDynamicHook } from 'views/SwapSimplify/hooks/useHasDynamicHook'
import { BridgeStatus, BridgeStatusData } from '../types'

export interface BridgeOrderFee extends TradePriceBreakdown {
  type: OrderType
  hasDynamicFee?: boolean
}

export function getBridgeOrderPriceImpact(
  priceBreakdown?: BridgeOrderFee[] | TradePriceBreakdown,
): Percent | null | undefined {
  return Array.isArray(priceBreakdown)
    ? // find the highest priceImpactWithoutFee
      priceBreakdown
        .filter((p) => !p || p.type !== OrderType.PCS_BRIDGE)
        .reduce((highest, current) => {
          if (
            !highest ||
            (highest && current.priceImpactWithoutFee && current.priceImpactWithoutFee.greaterThan(highest))
          ) {
            return current.priceImpactWithoutFee
          }
          return highest
        }, priceBreakdown[0]?.priceImpactWithoutFee)
    : priceBreakdown?.priceImpactWithoutFee
}

export function computeBridgeOrderFee(order: BridgeOrderWithCommands): BridgeOrderFee | BridgeOrderFee[] {
  if (!order.noSlippageCommands) {
    return {
      priceImpactWithoutFee: undefined,
      lpFeeAmount: undefined,
      type: OrderType.PCS_BRIDGE,
    }
  }

  return order.noSlippageCommands.map((command) => {
    if (command.type === OrderType.PCS_BRIDGE) {
      return {
        // TODO: add price impact for bridge
        priceImpactWithoutFee: undefined,
        lpFeeAmount: order.bridgeFee,
        type: command.type,
      }
    }

    const o = isXOrder(command) ? command.ammTrade : command?.trade

    return {
      ...computeTradePriceBreakdown(o),
      hasDynamicFee: detectHasDynamicHook(o),
      type: command.type,
    }
  })
}

export function customBridgeStatus(bridgeStatus: BridgeStatusData | undefined) {
  if (!bridgeStatus || !bridgeStatus?.data) return BridgeStatus.PENDING

  // If any step is PENDING, return overall bridge status as PENDING
  if (
    bridgeStatus.data.some(
      (command) => command.status.code === BridgeStatus.PENDING || command.status.code === BridgeStatus.BRIDGE_PENDING,
    )
  ) {
    return BridgeStatus.PENDING
  }

  // if bridgeStatus?.data.length <= 1, use bridgeStatus.status
  if (bridgeStatus.data.length <= 1) {
    return bridgeStatus.status
  }

  // if bridgeStatus?.data.length > 1,
  // bridge status will be the last command's status
  const lastCommand = bridgeStatus.data[bridgeStatus.data.length - 1]

  // if the last command is failed, and other commands are success, return PARTIAL_SUCCESS
  if (lastCommand.status.code === BridgeStatus.FAILED) {
    const successCommands = bridgeStatus.data.filter((command) => command.status.code === BridgeStatus.SUCCESS)
    if (successCommands.length > 0) {
      return BridgeStatus.PARTIAL_SUCCESS
    }
  }

  return lastCommand.status.code
}
