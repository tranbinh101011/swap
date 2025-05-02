import { OrderType } from '@pancakeswap/price-api-sdk'
import { InfinityRouter, SmartRouter } from '@pancakeswap/smart-router'
import { TradeType } from '@pancakeswap/swap-sdk-core'
import { currencyUSDPriceAtom } from 'hooks/useCurrencyUsdPrice'
import { nativeCurrencyAtom } from 'hooks/useNativeCurrency'
import { globalWorkerAtom } from 'hooks/useWorker'
import { atomFamily } from 'jotai/utils'
import { multicallGasLimitAtom } from 'quoter/hook/useMulticallGasLimit'
import { NoValidRouteError, QuoteQuery } from 'quoter/quoter.types'
import { createQuoteProvider } from 'quoter/utils/createQuoteProvider'
import { filterPools } from 'quoter/utils/filterPoolsV3'
import { gasPriceWeiAtom } from 'quoter/utils/gasPriceAtom'
import { getAllowedPoolTypes } from 'quoter/utils/getAllowedPoolTypes'
import { isEqualQuoteQuery } from 'quoter/utils/PoolHashHelper'
import { InterfaceOrder } from 'views/Swap/utils'
import { atomWithLoadable } from './atomWithLoadable'
import { commonPoolsLiteAtom } from './poolsAtom'

export const bestAMMTradeFromQuoterWorkerAtom = atomFamily((option: QuoteQuery) => {
  const { amount, currency, tradeType, maxSplits, v2Swap, v3Swap } = option
  return atomWithLoadable(async (get) => {
    const gasLimit = await get(multicallGasLimitAtom(currency?.chainId))
    if (!amount || !amount.currency || !currency) {
      return undefined
    }
    const quoteProvider = createQuoteProvider({
      gasLimit,
    })
    const worker = get(globalWorkerAtom)

    if (!worker) {
      throw new Error('Quote worker not initialized')
    }

    try {
      const candidatePools = await get(
        commonPoolsLiteAtom({
          quoteHash: option.hash,
          currencyA: amount.currency,
          currencyB: currency,
          chainId: currency.chainId,
          infinity: option.infinitySwap,
          v2Pools: Boolean(v2Swap),
          v3Pools: Boolean(v3Swap),
          stableSwap: Boolean(option.stableSwap),
          signal: option.signal,
          provider: option.provider,
          options: {
            blockNumber: option.blockNumber,
          },
          for: option.for,
        }),
      )

      const filtered = filterPools(candidatePools)

      const quoteCurrencyUsdPrice = await get(currencyUSDPriceAtom(currency))
      const nativeCurrency = get(nativeCurrencyAtom(currency.chainId))
      const nativeCurrencyUsdPrice = await get(currencyUSDPriceAtom(nativeCurrency))

      const gasPriceWei = await get(gasPriceWeiAtom(currency?.chainId))
      const quoterConfig = (quoteProvider as ReturnType<typeof SmartRouter.createQuoteProvider>)?.getConfig?.()
      const result = await worker.getBestTrade({
        chainId: currency.chainId,
        currency: SmartRouter.Transformer.serializeCurrency(currency),
        tradeType: tradeType || TradeType.EXACT_INPUT,
        amount: {
          currency: SmartRouter.Transformer.serializeCurrency(amount.currency),
          value: amount.quotient.toString(),
        },
        gasPriceWei: typeof gasPriceWei !== 'function' ? gasPriceWei?.toString() : undefined,
        maxHops: 3,
        maxSplits,
        poolTypes: getAllowedPoolTypes(option),
        candidatePools: filtered.map(SmartRouter.Transformer.serializePool),
        onChainQuoterGasLimit: quoterConfig?.gasLimit?.toString(),
        quoteCurrencyUsdPrice,
        nativeCurrencyUsdPrice,
        signal: option.signal,
      })
      const parsed = SmartRouter.Transformer.parseTrade(currency.chainId, result as any)
      parsed.quoteQueryHash = option.hash
      return {
        type: OrderType.PCS_CLASSIC,
        trade: parsed as any as InfinityRouter.InfinityTradeWithoutGraph<TradeType>,
      } as InterfaceOrder
    } catch (ex) {
      console.warn(`[quote]`, ex)
      throw new NoValidRouteError()
    }
  })
}, isEqualQuoteQuery)
