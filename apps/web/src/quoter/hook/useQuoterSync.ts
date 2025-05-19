import { useDebounce } from '@orbs-network/twap-ui/dist/hooks'
import { TradeType } from '@pancakeswap/swap-sdk-core'
import tryParseAmount from '@pancakeswap/utils/tryParseAmount'
import { useCurrency } from 'hooks/Tokens'
import { useInputBasedAutoSlippageWithFallback } from 'hooks/useAutoSlippageWithFallback'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { activeQuoteHashAtom } from 'quoter/atom/abortControlAtoms'
import { baseAllTypeBestTradeAtom, pauseAtom, userTypingAtom } from 'quoter/atom/bestTradeUISyncAtom'
import { updatePlaceholderAtom } from 'quoter/atom/placeholderAtom'
import { fetchCommonPoolsOnChain } from 'quoter/atom/poolsAtom'
import { QUOTE_REVALIDATE_TIME } from 'quoter/consts'
import { PoolQuery, QuoteQuery } from 'quoter/quoter.types'
import { useEffect } from 'react'
import { useCurrentBlock } from 'state/block/hooks'
import { Field } from 'state/swap/actions'
import { useSwapState } from 'state/swap/hooks'
import { useAccount } from 'wagmi'
import { bestQuoteAtom } from '../atom/bestQuoteAtom'
import { quoteNonceAtom } from '../atom/revalidateAtom'
import { createQuoteQuery } from '../utils/createQuoteQuery'
import { useQuoteContext } from './QuoteContext'

export const useQuoterSync = () => {
  const swapState = useSwapState()
  const debouncedSwapState = useDebounce(swapState, 300)
  const {
    independentField,
    typedValue,
    [Field.INPUT]: { currencyId: inputCurrencyId },
    [Field.OUTPUT]: { currencyId: outputCurrencyId },
  } = debouncedSwapState
  const { address } = useAccount()
  const inputCurrency = useCurrency(inputCurrencyId)
  const outputCurrency = useCurrency(outputCurrencyId)
  const isExactIn = independentField === Field.INPUT
  const independentCurrency = isExactIn ? inputCurrency : outputCurrency
  const dependentCurrency = isExactIn ? outputCurrency : inputCurrency
  const tradeType = isExactIn ? TradeType.EXACT_INPUT : TradeType.EXACT_OUTPUT
  const amount = tryParseAmount(typedValue, independentCurrency ?? undefined)
  const {
    singleHopOnly,
    split,
    v2Swap,
    v3Swap,
    infinitySwap,
    stableSwap,
    maxHops,
    chainId,
    speedQuoteEnabled,
    xEnabled,
  } = useQuoteContext()
  const setTrade = useSetAtom(baseAllTypeBestTradeAtom)
  const setTyping = useSetAtom(userTypingAtom)
  const [paused, pauseQuote] = useAtom(pauseAtom)

  const { slippageTolerance: slippage } = useInputBasedAutoSlippageWithFallback(amount)
  const blockNumber = useCurrentBlock()
  const setActiveQuoteHash = useSetAtom(activeQuoteHashAtom)
  const [nonce, setNonce] = useAtom(quoteNonceAtom)

  const quoteQueryInit = {
    amount,
    currency: dependentCurrency,
    baseCurrency: independentCurrency,
    tradeType,
    maxHops: singleHopOnly ? 1 : maxHops,
    maxSplits: split ? undefined : 0,
    v2Swap,
    v3Swap,
    infinitySwap,
    stableSwap,
    speedQuoteEnabled,
    xEnabled,
    slippage,
    address,
    blockNumber,
    nonce,
    for: 'main',
  }

  const quoteQuery = createQuoteQuery(quoteQueryInit)
  const setPlaceholder = useSetAtom(updatePlaceholderAtom)
  const quoteHistory: QuoteQuery[] = []

  useEffect(() => {
    if (!inputCurrency || !outputCurrency) {
      return
    }
    const poolQuery: PoolQuery = {
      quoteHash: quoteQuery.hash,
      currencyA: inputCurrency,
      currencyB: outputCurrency,
      options: {},
      chainId,
      infinity: quoteQuery.infinitySwap,
      v2Pools: !!quoteQuery.v2Swap,
      v3Pools: !!quoteQuery.v3Swap,
      signal: quoteQuery.signal,
      stableSwap: !!quoteQuery.stableSwap,
      provider: quoteQuery.provider,
    }

    // Prefetch pools
    try {
      fetchCommonPoolsOnChain(poolQuery)
    } catch (ex) {
      console.warn(ex)
    }
  }, [quoteQuery.hash, inputCurrency, outputCurrency])

  useEffect(() => {
    while (quoteHistory.length > 0) {
      const historyQuote = quoteHistory.pop()
      historyQuote?.controller?.abort()
    }

    quoteHistory.push(quoteQuery)
    setActiveQuoteHash(quoteQuery.hash)
  }, [quoteQuery.hash])

  useEffect(() => {
    setTyping(true)
  }, [typedValue, setTyping])

  const quoteResult = useAtomValue(bestQuoteAtom(quoteQuery))
  useEffect(() => {
    let t = 0
    const interval = setInterval(() => {
      const outdated = Date.now() - quoteQuery.createTime! > QUOTE_REVALIDATE_TIME
      if (paused || (!outdated && quoteResult.loading)) {
        return
      }
      if (t > 0) {
        if (t % QUOTE_REVALIDATE_TIME === 0) {
          setNonce((v) => v + 1)
        }
      }
      t++
    }, 1000)

    return () => {
      clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteQuery.hash, paused, quoteResult.loading])

  useEffect(() => {
    if (quoteResult.isJust() && !quoteResult.hasFlag('placeholder')) {
      const placeholderHash = quoteResult.getExtra('placeholderHash') as string
      setPlaceholder(placeholderHash, quoteResult.unwrap())
    }

    if (paused) {
      return
    }

    const order = quoteResult.unwrapOr(undefined)

    setTrade({
      bestOrder: order,
      tradeLoaded: !quoteResult.isPending(),
      tradeError: quoteResult.error,
      refreshDisabled: false,
      refreshOrder: () => {
        setNonce((v) => v + 1)
      },
      refreshTrade: () => {
        setNonce((v) => v + 1)
      },
      pauseQuoting: () => {
        pauseQuote(true)
      },
      resumeQuoting: () => {
        pauseQuote(false)
      },
    })
    setTyping(false)
  }, [quoteResult.value, quoteResult.loading, quoteResult.error, pauseQuote, setTrade, setTyping, setNonce, paused])
}
