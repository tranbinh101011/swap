import { useDebounce } from '@orbs-network/twap-ui/dist/hooks'
import { TradeType } from '@pancakeswap/swap-sdk-core'
import tryParseAmount from '@pancakeswap/utils/tryParseAmount'
import { POOLS_FAST_REVALIDATE } from 'config/pools'
import { useCurrency } from 'hooks/Tokens'
import { useInputBasedAutoSlippageWithFallback } from 'hooks/useAutoSlippageWithFallback'
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai'
import { atomFamily } from 'jotai/utils'
import { activeQuoteHashAtom } from 'quoter/atom/abortControlAtoms'
import { baseAllTypeBestTradeAtom, pauseAtom, userTypingAtom } from 'quoter/atom/bestTradeUISyncAtom'
import { updatePlaceholderAtom } from 'quoter/atom/placeholderAtom'
import { QUOTE_REVALIDATE_TIME } from 'quoter/consts'
import { QuoteQuery } from 'quoter/quoter.types'
import { fetchCandidatePools, fetchCandidatePoolsLite } from 'quoter/utils/poolQueries'
import { useEffect } from 'react'
import { useCurrentBlock } from 'state/block/hooks'
import { Field } from 'state/swap/actions'
import { useSwapState } from 'state/swap/hooks'
import { useAccount } from 'wagmi'
import { bestQuoteAtom } from '../atom/bestQuoteAtom'
import { quoteNonceAtom } from '../atom/revalidateAtom'
import { createPoolQuery, createQuoteQuery } from '../utils/createQuoteQuery'
import { useQuoteContext } from './QuoteContext'
import { multicallGasLimitAtom } from './useMulticallGasLimit'

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
  const gasLimit = useAtomValue(multicallGasLimitAtom(chainId))

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
    gasLimit,
  }

  const quoteQuery = createQuoteQuery(quoteQueryInit)
  useAtomValue(prefetchPoolsAtom(quoteQuery))
  const setPlaceholder = useSetAtom(updatePlaceholderAtom)

  useEffect(() => {
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

const prefetchPoolsAtom = atomFamily(
  (quoteQuery: QuoteQuery) => {
    return atom(async () => {
      if (!quoteQuery.baseCurrency || !quoteQuery.currency) {
        return
      }
      const { poolQuery, poolOptions } = createPoolQuery(quoteQuery)
      fetchCandidatePools(poolQuery, poolOptions)
      fetchCandidatePoolsLite(poolQuery, poolOptions)
    })
  },
  (a, b) => {
    const isEqualQuote = a.hash === b.hash
    if (!isEqualQuote) {
      return false
    }

    const chainId = a.currency?.chainId
    if (!chainId) {
      return true
    }
    const ttl = POOLS_FAST_REVALIDATE[chainId]
    const epochA = Math.floor(a.createTime / ttl)
    const epochB = Math.floor(a.createTime / ttl)
    return epochB === epochA
  },
)
