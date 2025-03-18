import { useTranslation } from '@pancakeswap/localization'
import { Currency, CurrencyAmount, Percent } from '@pancakeswap/sdk'
import { Column, Text, useMatchBreakpoints } from '@pancakeswap/uikit'
import { formatAmount } from '@pancakeswap/utils/formatFractions'
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'

import CurrencyInputPanelSimplify from 'components/CurrencyInputPanelSimplify'
import { CommonBasesType } from 'components/SearchModal/types'
import { useCurrency } from 'hooks/Tokens'
import { Field, replaceSwapState } from 'state/swap/actions'
import { queryParametersToSwapState, useDefaultsFromURLSearch, useSwapState } from 'state/swap/hooks'
import { useSwapActionHandlers } from 'state/swap/useSwapActionHandlers'
import { useCurrencyBalances } from 'state/wallet/hooks'
import { currencyId } from 'utils/currencyId'
import { maxAmountSpend } from 'utils/maxAmountSpend'

import { CAKE, STABLE_COIN, USDC, USDT } from '@pancakeswap/tokens'
import { SwapUIV2 } from '@pancakeswap/widgets-internal'
import { useActiveChainId } from 'hooks/useActiveChainId'
import useNativeCurrency from 'hooks/useNativeCurrency'
import { useAtom } from 'jotai'
import { useRouter } from 'next/router'
import { swapReducerAtom } from 'state/swap/reducer'
import { useAccount } from 'wagmi'
import useWarningImport from '../../Swap/hooks/useWarningImport'
import { useIsWrapping } from '../../Swap/V3Swap/hooks'
import { FlipButton } from './FlipButton'

interface Props {
  inputAmount?: CurrencyAmount<Currency>
  outputAmount?: CurrencyAmount<Currency>
  tradeLoading?: boolean
  pricingAndSlippage?: ReactNode
  swapCommitButton?: ReactNode
  isUserInsufficientBalance?: boolean
}

export function FormMainForHomePage({ inputAmount, outputAmount, tradeLoading, isUserInsufficientBalance }: Props) {
  const { address: account } = useAccount()
  const { t } = useTranslation()
  const warningSwapHandler = useWarningImport()
  const { isMobile } = useMatchBreakpoints()
  const {
    independentField,
    typedValue,
    [Field.INPUT]: { currencyId: inputCurrencyId },
    [Field.OUTPUT]: { currencyId: outputCurrencyId },
  } = useSwapState()
  const isWrapping = useIsWrapping()
  const inputCurrency = useCurrency(inputCurrencyId)
  const outputCurrency = useCurrency(outputCurrencyId)
  const { onCurrencySelection, onUserInput } = useSwapActionHandlers()
  const [inputBalance] = useCurrencyBalances(account, [inputCurrency, outputCurrency])
  const maxAmountInput = useMemo(() => maxAmountSpend(inputBalance), [inputBalance])
  const loadedUrlParams = useDefaultsFromURLSearch()
  // const loadedUrlParams = {
  //   inputCurrencyId: 'BNB',
  //   outputCurrencyId: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82',
  // }

  useDefaults()
  const handleTypeInput = useCallback((value: string) => onUserInput(Field.INPUT, value), [onUserInput])
  const handleTypeOutput = useCallback((value: string) => onUserInput(Field.OUTPUT, value), [onUserInput])

  const handlePercentInput = useCallback(
    (percent: number) => {
      if (maxAmountInput) {
        onUserInput(Field.INPUT, maxAmountInput.multiply(new Percent(percent, 100)).toExact())
      }
    },
    [maxAmountInput, onUserInput],
  )

  const handleMaxInput = useCallback(() => {
    if (maxAmountInput) {
      onUserInput(Field.INPUT, maxAmountInput.toExact())
    }
  }, [maxAmountInput, onUserInput])

  const handleCurrencySelect = useCallback(
    (
      newCurrency: Currency,
      field: Field,
      currentInputCurrencyId: string | undefined,
      currentOutputCurrencyId: string | undefined,
    ) => {
      onCurrencySelection(field, newCurrency)

      warningSwapHandler(newCurrency)

      const isInput = field === Field.INPUT
      const oldCurrencyId = isInput ? currentInputCurrencyId : currentOutputCurrencyId
      const otherCurrencyId = isInput ? currentOutputCurrencyId : currentInputCurrencyId
      const newCurrencyId = currencyId(newCurrency)
    },
    [onCurrencySelection, warningSwapHandler],
  )
  const handleInputSelect = useCallback(
    (newCurrency: Currency) =>
      handleCurrencySelect(newCurrency, Field.INPUT, inputCurrencyId || '', outputCurrencyId || ''),
    [handleCurrencySelect, inputCurrencyId, outputCurrencyId],
  )
  const handleOutputSelect = useCallback(
    (newCurrency: Currency) =>
      handleCurrencySelect(newCurrency, Field.OUTPUT, inputCurrencyId || '', outputCurrencyId || ''),
    [handleCurrencySelect, inputCurrencyId, outputCurrencyId],
  )

  const isTypingInput = independentField === Field.INPUT
  const inputValue = useMemo(
    () => typedValue && (isTypingInput ? typedValue : formatAmount(inputAmount) || ''),
    [typedValue, isTypingInput, inputAmount],
  )
  const outputValue = useMemo(
    () => typedValue && (isTypingInput ? formatAmount(outputAmount) || '' : typedValue),
    [typedValue, isTypingInput, outputAmount],
  )
  const inputLoading = typedValue ? !isTypingInput && tradeLoading : false
  const outputLoading = typedValue ? isTypingInput && tradeLoading : false

  return (
    <SwapUIV2.InputPanelWrapper id="swap-page">
      <Column gap={isMobile ? '0px' : 'sm'}>
        <CurrencyInputPanelSimplify
          id="swap-currency-input"
          showUSDPrice
          showMaxButton
          showCommonBases
          topOptions={{
            show: !isMobile,
            walletDisplay: false,
          }}
          inputLoading={!isWrapping && inputLoading}
          currencyLoading={!loadedUrlParams}
          label={!isTypingInput && !isWrapping ? t('From (estimated)') : t('From')}
          value={isWrapping ? typedValue : inputValue}
          maxAmount={maxAmountInput}
          showQuickInputButton
          currency={inputCurrency}
          onUserInput={handleTypeInput}
          onPercentInput={handlePercentInput}
          onMax={handleMaxInput}
          onCurrencySelect={handleInputSelect}
          otherCurrency={outputCurrency}
          commonBasesType={CommonBasesType.SWAP_LIMITORDER}
          title={
            <Text color="textSubtle" fontSize={12} bold>
              {t('From')}
            </Text>
          }
          isUserInsufficientBalance={isUserInsufficientBalance}
        />
        <FlipButton compact={isMobile} replaceBrowser={false} />
        <CurrencyInputPanelSimplify
          id="swap-currency-output"
          showUSDPrice
          showCommonBases
          showMaxButton={false}
          inputLoading={!isWrapping && outputLoading}
          currencyLoading={!loadedUrlParams}
          label={isTypingInput && !isWrapping ? t('To (estimated)') : t('To')}
          value={isWrapping ? typedValue : outputValue}
          currency={outputCurrency}
          onUserInput={handleTypeOutput}
          onCurrencySelect={handleOutputSelect}
          otherCurrency={inputCurrency}
          commonBasesType={CommonBasesType.SWAP_LIMITORDER}
          topOptions={{
            show: !isMobile,
            walletDisplay: false,
          }}
          title={
            <Text color="textSubtle" fontSize={12} bold>
              {t('To')}
            </Text>
          }
        />
      </Column>
    </SwapUIV2.InputPanelWrapper>
  )
}

function useDefaults(): { inputCurrencyId: string | undefined; outputCurrencyId: string | undefined } | undefined {
  const { chainId } = useActiveChainId()
  const [, dispatch] = useAtom(swapReducerAtom)
  const native = useNativeCurrency()
  const { isReady } = useRouter()
  const [result, setResult] = useState<
    { inputCurrencyId: string | undefined; outputCurrencyId: string | undefined } | undefined
  >()

  useEffect(() => {
    if (!chainId || !native || !isReady) return

    const parsed = queryParametersToSwapState(
      {},
      native.symbol,
      CAKE[chainId]?.address ?? STABLE_COIN[chainId]?.address ?? USDC[chainId]?.address ?? USDT[chainId]?.address,
    )

    dispatch(
      replaceSwapState({
        typedValue: parsed.typedValue,
        field: parsed.independentField,
        inputCurrencyId: parsed[Field.INPUT].currencyId,
        outputCurrencyId: parsed[Field.OUTPUT].currencyId,
        recipient: null,
      }),
    )
    setResult({ inputCurrencyId: parsed[Field.INPUT].currencyId, outputCurrencyId: parsed[Field.OUTPUT].currencyId })
  }, [dispatch, chainId, native, isReady])

  return result
}
