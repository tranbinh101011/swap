import { TradeType } from '@pancakeswap/swap-sdk-core'
import { getIsWrapping } from 'hooks/useWrapCallback'
import { atom } from 'jotai'
import { atomFamily } from 'jotai/utils'
import { isBetterQuoteTrade } from 'quoter/utils/getBetterQuote'
import { isEqualQuoteQuery, PoolHashHelper } from 'quoter/utils/PoolHashHelper'
import { logGTMQuoteQueryEvent } from 'utils/customGTMEventTracking'
import { InterfaceOrder } from 'views/Swap/utils'
import { NoValidRouteError, QuoteQuery, StrategyQuery } from '../quoter.types'
import { activeQuoteHashAtom } from './abortControlAtoms'
import { emptyLoadable, errorLoadable, Loadable, pendingLoadable, valueLoadable } from './atomWithLoadable'
import { placeholderAtom } from './placeholderAtom'
import { getRoutingStrategy, StrategyRoute, updateStrategy } from './routingStrategy'

const bestQuoteWithoutHashAtom = atomFamily((_option: QuoteQuery) => {
  const strategyQuery: StrategyQuery = {
    baseCurrency: _option.baseCurrency || undefined,
    quoteCurrency: _option.currency || undefined,
    v2Swap: _option.v2Swap,
    v3Swap: _option.v3Swap,
    infinitySwap: _option.infinitySwap,
    chainId: _option.baseCurrency?.chainId,
    maxHops: _option.maxHops,
    maxSplits: _option.maxSplits,
  }
  const strategyHash = PoolHashHelper.hashStrategyQuery(strategyQuery)
  return atom((get) => {
    function executeRoutes(routes: StrategyRoute[], option: QuoteQuery) {
      try {
        const quotes = routes.map((route) => get(route.query({ ...option, ...route.overrides })))
        const anyLoading = quotes.some((x) => x?.loading)
        const best = findBestQuote(...quotes)
        if (!best) {
          if (anyLoading) {
            return pendingLoadable<InterfaceOrder | undefined>()
          }
          return undefined
        }
        const [bestQuote, bestIndex] = best
        if (bestQuote) {
          if (!anyLoading) {
            updateStrategy(strategyHash, routes[bestIndex])
            return valueLoadable(bestQuote)
          }
          return pendingLoadable<InterfaceOrder | undefined>(bestQuote)
        }
        return emptyLoadable<InterfaceOrder | undefined>()
      } catch (ex) {
        console.warn(`[quote]`, ex)
        return emptyLoadable<InterfaceOrder | undefined>()
      }
    }

    // No active quote hash means some new quoter has started
    // This quoter query is outdated
    const activeQuoteHash = get(activeQuoteHashAtom)
    if (!activeQuoteHash) {
      return pendingLoadable<InterfaceOrder | undefined>()
    }

    const option: QuoteQuery = { enabled: true, type: 'quoter', tradeType: TradeType.EXACT_INPUT, ..._option }
    try {
      const isWrapping = getIsWrapping(option.amount?.currency, option.currency || undefined, option.currency?.chainId)
      if (isWrapping || !option.enabled) {
        return emptyLoadable<InterfaceOrder | undefined>()
      }
      if (!option.baseCurrency || !option.currency) {
        return emptyLoadable<InterfaceOrder | undefined>()
      }
      if (option.baseCurrency?.equals(option.currency)) {
        return emptyLoadable<InterfaceOrder | undefined>()
      }
      if (!option.amount?.quotient) {
        return emptyLoadable<InterfaceOrder | undefined>()
      }

      if (!logMap.has(option.hash)) {
        logGTMQuoteQueryEvent('start', {
          chain: option.baseCurrency.chainId,
          currencyA: option.baseCurrency,
          currencyB: option.currency,
          type: option.tradeType || TradeType.EXACT_INPUT,
        })
        logMap.set(option.hash, Date.now())
      }

      const strategy = getRoutingStrategy(strategyHash)
      for (const routes of strategy) {
        const quote = executeRoutes(routes, option)
        if (quote) {
          const time = logMap.get(option.hash) || Date.now()
          logGTMQuoteQueryEvent('succ', {
            chain: option.baseCurrency.chainId,
            currencyA: option.baseCurrency,
            currencyB: option.currency,
            type: option.tradeType || TradeType.EXACT_INPUT,
            time: Date.now() - time,
          })
          return quote
        }
      }
      throw new NoValidRouteError()
      // return errorLoadable<InterfaceOrder | undefined>(new NoValidRouteError())
    } catch (ex) {
      // eslint-disable-next-line no-console
      console.warn(`[quote]`, ex)
      logGTMQuoteQueryEvent('fail', {
        chain: option.baseCurrency?.chainId,
        currencyA: option.baseCurrency || undefined,
        currencyB: option.currency || undefined,
        type: option.tradeType || TradeType.EXACT_INPUT,
      })
      return errorLoadable<InterfaceOrder | undefined>(ex)
    }
  })
}, isEqualQuoteQuery)

export const bestQuoteAtom = atomFamily((_option: QuoteQuery) => {
  return atom((get) => {
    const result = get(bestQuoteWithoutHashAtom(_option))
    if (!result.data?.trade && _option.placeholderHash) {
      const placeHolder = get(placeholderAtom(_option.placeholderHash))
      return { ...result, data: placeHolder, hash: _option.hash, placeholderHash: _option.placeholderHash }
    }
    return { ...result, hash: _option.hash, placeholderHash: _option.placeholderHash }
  })
}, isEqualQuoteQuery)

function findBestQuote(...args: Loadable<InterfaceOrder | undefined>[]): [InterfaceOrder, number] | undefined {
  const fulfilledValues = args.filter((x) => x.data).map((x) => x.data)

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

const logMap = new Map<string, number>()
