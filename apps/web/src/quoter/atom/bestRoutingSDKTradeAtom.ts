import { OrderType } from '@pancakeswap/price-api-sdk'
import { InfinityRouter, SmartRouter } from '@pancakeswap/smart-router'
import { TradeType } from '@pancakeswap/swap-sdk-core'
import { globalWorkerAtom } from 'hooks/useWorker'
import { atomFamily } from 'jotai/utils'
import { QUOTE_TIMEOUT } from 'quoter/consts'
import { quoteTraceAtom } from 'quoter/perf/quoteTracker'
import { createPoolQuery } from 'quoter/utils/createQuoteQuery'
import { gasPriceWeiAtom } from 'quoter/utils/gasPriceAtom'
import { getVerifiedTrade } from 'quoter/utils/getVerifiedTrade'
import { isEqualQuoteQuery } from 'quoter/utils/PoolHashHelper'
import { fetchCandidatePools } from 'quoter/utils/poolQueries'
import { withTimeout } from 'utils/withTimeout'
import { InterfaceOrder } from 'views/Swap/utils'
import { InfinityGetBestTradeReturnType, NoValidRouteError, QuoteQuery } from '../quoter.types'
import { atomWithLoadable } from './atomWithLoadable'

export const bestRoutingSDKTradeAtom = atomFamily((option: QuoteQuery) => {
  const { amount, currency, tradeType, maxSplits, v2Swap, v3Swap, infinitySwap } = option
  return atomWithLoadable(async (get) => {
    if (!amount || !amount.currency || !currency) {
      return undefined
    }

    const worker = get(globalWorkerAtom)

    if (!worker) {
      throw new Error('Quote worker not initialized')
    }
    const perf = get(quoteTraceAtom(option))
    perf.tracker.track('start')

    const query = withTimeout(async () => {
      const { poolQuery, poolOptions } = createPoolQuery(option)
      const [candidatePools, gasPriceWei] = await Promise.all([
        fetchCandidatePools(poolQuery, poolOptions),
        get(gasPriceWeiAtom(currency?.chainId)),
      ])
      perf.tracker.track('pool_success')
      const result = await worker.getBestTradeOffchain({
        chainId: currency.chainId,
        currency: SmartRouter.Transformer.serializeCurrency(currency),
        tradeType: tradeType || TradeType.EXACT_INPUT,
        amount: {
          currency: SmartRouter.Transformer.serializeCurrency(amount.currency),
          value: amount.quotient.toString(),
        },
        gasPriceWei: gasPriceWei?.toString() || '',
        maxHops: option.maxHops,
        maxSplits,
        candidatePools: candidatePools.map(SmartRouter.Transformer.serializePool),
        signal: option.signal,
      })
      const trade = InfinityRouter.Transformer.parseTrade(currency.chainId, result) ?? null
      const verifiedTrade = await getVerifiedTrade(trade)

      if (verifiedTrade) {
        verifiedTrade.quoteQueryHash = option.hash
      }
      const order = {
        type: OrderType.PCS_CLASSIC,
        trade: (verifiedTrade || undefined) as InfinityGetBestTradeReturnType | undefined,
      } as InterfaceOrder
      perf.tracker.success(order)
      return order
    }, QUOTE_TIMEOUT)

    try {
      return await query()
    } catch (ex) {
      perf.tracker.fail(ex)
      throw new NoValidRouteError()
    } finally {
      perf.tracker.report()
    }
  })
}, isEqualQuoteQuery)
