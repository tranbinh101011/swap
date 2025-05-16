import { TradeType } from '@pancakeswap/swap-sdk-core'
import { Loadable } from '@pancakeswap/utils/Loadable'
import { getIsWrapping } from 'hooks/useWrapCallback'
import { atom } from 'jotai'
import { atomFamily } from 'jotai/utils'
import { isBetterQuoteTrade } from 'quoter/utils/getBetterQuote'
import { isEqualQuoteQuery } from 'quoter/utils/PoolHashHelper'
import { InterfaceOrder } from 'views/Swap/utils'
import { NoValidRouteError, QuoteQuery } from '../quoter.types'
import { activeQuoteHashAtom } from './abortControlAtoms'
import { placeholderAtom } from './placeholderAtom'
import { getRoutingStrategy, StrategyRoute } from './routingStrategy'

const bestQuoteWithoutHashAtom = atomFamily((_option: QuoteQuery) => {
  return atom((get) => {
    function executeRoutes(strategies: StrategyRoute[], option: QuoteQuery): Loadable<InterfaceOrder> {
      try {
        const quotes = strategies.map((route) =>
          get(route.query({ ...option, ...route.overrides, routeKey: route.key })),
        )
        const anyPending = quotes.some((x) => x?.isPending())
        const best = findBestQuote(...quotes)
        if (!best) {
          if (anyPending) {
            return Loadable.Pending<InterfaceOrder>()
          }
          return Loadable.Nothing<InterfaceOrder>()
        }
        const [bestQuote, bestIndex] = best
        if (bestQuote) {
          if (!anyPending) {
            // updateStrategy(strategyHash, routes[bestIndex])
            return Loadable.Just<InterfaceOrder>(bestQuote)
          }
          return Loadable.Nothing<InterfaceOrder>()
        }
        return Loadable.Nothing<InterfaceOrder>()
      } catch (ex) {
        return Loadable.Fail<InterfaceOrder>(new NoValidRouteError())
      }
    }

    // No active quote hash means some new quoter has started
    // This quoter query is outdated
    const activeQuoteHash = get(activeQuoteHashAtom)
    if (!activeQuoteHash) {
      return Loadable.Pending<InterfaceOrder>()
    }

    const option: QuoteQuery = { enabled: true, type: 'quoter', tradeType: TradeType.EXACT_INPUT, ..._option }
    try {
      const isWrapping = getIsWrapping(option.amount?.currency, option.currency || undefined, option.currency?.chainId)
      if (isWrapping || !option.enabled) {
        return Loadable.Nothing<InterfaceOrder>()
      }
      if (!option.baseCurrency || !option.currency) {
        return Loadable.Nothing<InterfaceOrder>()
      }
      if (option.baseCurrency?.equals(option.currency)) {
        return Loadable.Nothing<InterfaceOrder>()
      }
      if (!option.amount?.quotient) {
        return Loadable.Nothing<InterfaceOrder>()
      }

      const strategies = getRoutingStrategy()
      const p1 = strategies.filter((x) => x.priority === 1)
      const p2 = strategies.filter((x) => x.priority === 2)
      const tests = [p1, p2]
      for (let i = 0; i < tests.length; i++) {
        const strategy = tests[i]
        const quote = executeRoutes(strategy, option)
        if (quote.isNothing() || quote.isFail()) {
          continue
        }
        return quote
      }
      return Loadable.Nothing<InterfaceOrder>()
    } catch (ex) {
      // eslint-disable-next-line no-console
      console.warn(`[quote]`, ex)
      return Loadable.Fail<InterfaceOrder>(ex)
    }
  })
}, isEqualQuoteQuery)

export const bestQuoteAtom = atomFamily((_option: QuoteQuery) => {
  return atom((get) => {
    const result = get(bestQuoteWithoutHashAtom(_option))

    if (result.isPending()) {
      const placeHolder = get(placeholderAtom(_option.placeholderHash || ''))
      if (placeHolder) {
        return Loadable.Just(placeHolder).setFlag('placeholder').setExtra('placeholderHash', _option.placeholderHash!)
      }
    }
    console.log(`[ph]`, 'hash', _option.placeholderHash)
    return result.setExtra('placeholderHash', _option.placeholderHash!)
  })
}, isEqualQuoteQuery)

function findBestQuote(...args: Loadable<InterfaceOrder>[]): [InterfaceOrder, number] | undefined {
  const fulfilledValues = args.filter((x) => x.isJust()).map((x) => x.unwrap())

  let bestOrder: InterfaceOrder | undefined
  let idx = -1
  for (let i = 0; i < fulfilledValues.length; i++) {
    const order = fulfilledValues[i]
    if (!bestOrder) {
      bestOrder = order
      idx = i
      continue
    }
    if (!order?.trade) continue
    if (isBetterQuoteTrade(bestOrder.trade, order.trade)) {
      bestOrder = order
      idx = i
    }
  }
  return bestOrder ? [bestOrder, idx] : undefined
}
