import { useDebounce } from '@orbs-network/twap-ui/dist/hooks'
import { TradeType } from '@pancakeswap/swap-sdk-core'
import tryParseAmount from '@pancakeswap/utils/tryParseAmount'
import { useCurrency } from 'hooks/Tokens'
import { useInputBasedAutoSlippageWithFallback } from 'hooks/useAutoSlippageWithFallback'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import {
  abortableViemProviderAtom,
  abortControllerAtom,
  abortSignalAtom,
  activeQuoteHashAtom,
} from 'quoter/atom/abortControlAtoms'
import { baseAllTypeBestTradeAtom, pauseAtom, userTypingAtom } from 'quoter/atom/bestTradeUISyncAtom'
import { updatePlaceholderAtom } from 'quoter/atom/placeholderAtom'
import { QuoteQuery } from 'quoter/quoter.types'
import { useEffect, useRef } from 'react'
import { useCurrentBlock } from 'state/block/hooks'
import { Field } from 'state/swap/actions'
import { useSwapState } from 'state/swap/hooks'
import { useAccount } from 'wagmi'
import { bestQuoteAtom } from '../atom/bestQuoteAtom'
import { quoteNonceAtom } from '../atom/revalidateAtom'
import { createQuoteQuery } from '../utils/createQuoteQuery'
import { useQuoteContext } from './QuoteContext'

const REVALIDATE_TIME = 10

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
  const historyHashes = useRef<string[]>([])
  const abortQuote = useSetAtom(abortSignalAtom)
  const [nonce, setNonce] = useAtom(quoteNonceAtom)

  const quoteQueryInit: QuoteQuery = {
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
    hash: '',
  }

  const quoteQuery = createQuoteQuery(quoteQueryInit)
  const setPlaceholder = useSetAtom(updatePlaceholderAtom)
  const abortController = useAtomValue(abortControllerAtom(quoteQuery.hash))
  const viemProvider = useAtomValue(abortableViemProviderAtom(quoteQuery.hash))
  quoteQuery.signal = abortController.signal
  quoteQuery.provider = viemProvider

  useEffect(() => {
    for (let i = 0; i < historyHashes.current.length; i++) {
      const hash = historyHashes.current[i]
      abortQuote(hash)
    }
    historyHashes.current = [quoteQuery.hash]
    setActiveQuoteHash(quoteQuery.hash)
  }, [quoteQuery.hash])

  useEffect(() => {
    setTyping(true)
  }, [typedValue, setTyping])

  const quoteResult = useAtomValue(bestQuoteAtom(quoteQuery))
  useEffect(() => {
    let t = 0
    const pauseTimer = paused || quoteResult.loading
    const interval = setInterval(() => {
      if (pauseTimer) {
        return
      }
      if (t > 0) {
        if (t % REVALIDATE_TIME === 0) {
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
    if (quoteResult.data?.trade && quoteResult.placeholderHash) {
      setPlaceholder(quoteResult.placeholderHash, quoteResult.data)
    }

    if (paused) {
      return
    }

    setTrade({
      bestOrder: quoteResult.data,
      tradeLoaded: !quoteResult?.loading,
      tradeError: quoteResult?.error,
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
  }, [quoteResult.data, quoteResult.loading, quoteResult.error, pauseQuote, setTrade, setTyping, setNonce, paused])
}
