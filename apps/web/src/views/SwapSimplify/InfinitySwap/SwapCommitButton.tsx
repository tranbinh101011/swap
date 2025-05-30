import { Currency } from '@pancakeswap/swap-sdk-core'
import { AutoColumn, Box, Button, Dots, Message, MessageText, Text, useModal } from '@pancakeswap/uikit'
import { useAddressBalance } from 'hooks/useAddressBalance'
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useTranslation } from '@pancakeswap/localization'
import { PriceOrder } from '@pancakeswap/price-api-sdk'
import { getUniversalRouterAddress } from '@pancakeswap/universal-router-sdk'
import { TimeoutError } from '@pancakeswap/utils/withTimeout'
import { ConfirmModalState } from '@pancakeswap/widgets-internal'
import { GreyCard } from 'components/Card'
import { CommitButton } from 'components/CommitButton'
import ConnectWalletButton from 'components/ConnectWalletButton'
import { AutoRow } from 'components/Layout/Row'
import {
  RoutingSettingsButton,
  SettingsModalV2,
  withCustomOnDismiss,
} from 'components/Menu/GlobalSettings/SettingsModalV2'
import { SettingsMode } from 'components/Menu/GlobalSettings/types'
import { BIG_INT_ZERO } from 'config/constants/exchange'
import { useCurrency } from 'hooks/Tokens'
import { useIsTransactionUnsupported } from 'hooks/Trades'
import useWrapCallback, { WrapType } from 'hooks/useWrapCallback'
import { useAtomValue } from 'jotai'
import { baseAllTypeBestTradeAtom } from 'quoter/atom/bestTradeUISyncAtom'
import { NoValidRouteError } from 'quoter/quoter.types'
import { Field } from 'state/swap/actions'
import { useSwapState } from 'state/swap/hooks'
import { useSwapActionHandlers } from 'state/swap/useSwapActionHandlers'
import { useRoutingSettingChanged } from 'state/user/smartRouter'
import { useCurrencyBalances } from 'state/wallet/hooks'
import { logGTMClickSwapConfirmEvent, logGTMClickSwapEvent } from 'utils/customGTMEventTracking'
import { warningSeverity } from 'utils/exchange'
import { isClassicOrder, isXOrder } from 'views/Swap/utils'
import { ConfirmSwapModalV2 } from 'views/Swap/V3Swap/containers/ConfirmSwapModalV2'
import { useAccount, useChainId } from 'wagmi'
import { useParsedAmounts, useSlippageAdjustedAmounts, useSwapInputError } from '../../Swap/V3Swap/hooks'
import { useConfirmModalState } from '../../Swap/V3Swap/hooks/useConfirmModalState'
import { useSwapConfig } from '../../Swap/V3Swap/hooks/useSwapConfig'
import { useSwapCurrency } from '../../Swap/V3Swap/hooks/useSwapCurrency'
import { CommitButtonProps } from '../../Swap/V3Swap/types'
import { computeTradePriceBreakdown } from '../../Swap/V3Swap/utils/exchange'
import { useIsRecipientError } from '../hooks/useIsRecipientError'

const SettingsModalWithCustomDismiss = withCustomOnDismiss(SettingsModalV2)

interface SwapCommitButtonPropsType {
  order?: PriceOrder
  tradeError?: Error | null
  tradeLoading?: boolean
}

const useSettingModal = (onDismiss) => {
  const [openSettingsModal] = useModal(
    <SettingsModalWithCustomDismiss customOnDismiss={onDismiss} mode={SettingsMode.SWAP_LIQUIDITY} />,
  )
  return openSettingsModal
}

const useSwapCurrencies = () => {
  const {
    [Field.INPUT]: { currencyId: inputCurrencyId },
    [Field.OUTPUT]: { currencyId: outputCurrencyId },
  } = useSwapState()
  const inputCurrency = useCurrency(inputCurrencyId) as Currency
  const outputCurrency = useCurrency(outputCurrencyId) as Currency
  return { inputCurrency, outputCurrency }
}

const WrapCommitButtonReplace: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { t } = useTranslation()
  const { inputCurrency, outputCurrency } = useSwapCurrencies()
  const { typedValue } = useSwapState()
  const {
    wrapType,
    execute: onWrap,
    inputError: wrapInputError,
  } = useWrapCallback(inputCurrency, outputCurrency, typedValue)
  const showWrap = wrapType !== WrapType.NOT_APPLICABLE

  const buttonText = useMemo(() => {
    return (
      wrapInputError ?? (wrapType === WrapType.WRAP ? t('Wrap') : wrapType === WrapType.UNWRAP ? t('Unwrap') : null)
    )
  }, [t, wrapInputError, wrapType])
  if (!showWrap) return children

  return (
    <CommitButton width="100%" disabled={Boolean(wrapInputError)} onClick={onWrap}>
      {buttonText}
    </CommitButton>
  )
}

const ConnectButtonReplace = ({ children }) => {
  const { address: account } = useAccount()

  if (!account) {
    return <ConnectWalletButton width="100%" withIcon />
  }
  return children
}

const UnsupportedSwapButtonReplace = ({ children }) => {
  const { t } = useTranslation()
  const { inputCurrency, outputCurrency } = useSwapCurrencies()
  const swapIsUnsupported = useIsTransactionUnsupported(inputCurrency, outputCurrency)

  if (swapIsUnsupported) {
    return (
      <Button width="100%" disabled>
        {t('Unsupported Asset')}
      </Button>
    )
  }
  return children
}

const SwapCommitButtonComp: React.FC<SwapCommitButtonPropsType & CommitButtonProps> = (props) => {
  return (
    <UnsupportedSwapButtonReplace>
      <ConnectButtonReplace>
        <WrapCommitButtonReplace>
          <SwapCommitButtonInner {...props} />
        </WrapCommitButtonReplace>
      </ConnectButtonReplace>
    </UnsupportedSwapButtonReplace>
  )
}

export const SwapCommitButton = memo(SwapCommitButtonComp)

function isSupportedErrorType(err: any) {
  return err instanceof NoValidRouteError || err instanceof TimeoutError
}

const SwapCommitButtonInner = memo(function SwapCommitButtonInner({
  order,
  tradeError,
  tradeLoading,
  beforeCommit,
  afterCommit,
}: SwapCommitButtonPropsType & CommitButtonProps) {
  const { address: account } = useAccount()
  const { t } = useTranslation()
  const chainId = useChainId()
  // form data
  const { independentField } = useSwapState()
  const [inputCurrency, outputCurrency] = useSwapCurrency()
  const { isExpertMode } = useSwapConfig()
  const { isRecipientEmpty, isRecipientError } = useIsRecipientError()

  const tradePriceBreakdown = useMemo(
    () => computeTradePriceBreakdown(isXOrder(order) ? undefined : order?.trade),
    [order],
  )

  // warnings on slippage
  const priceImpactSeverity = warningSeverity(
    tradePriceBreakdown ? tradePriceBreakdown.priceImpactWithoutFee : undefined,
  )

  const relevantTokenBalances = useCurrencyBalances(account ?? undefined, [
    inputCurrency ?? undefined,
    outputCurrency ?? undefined,
  ])
  const currencyBalances = useMemo(
    () => ({
      [Field.INPUT]: relevantTokenBalances[0],
      [Field.OUTPUT]: relevantTokenBalances[1],
    }),
    [relevantTokenBalances],
  )
  const parsedAmounts = useParsedAmounts(order?.trade, currencyBalances, false)
  const parsedIndependentFieldAmount = parsedAmounts[independentField]
  const swapInputError = useSwapInputError(order, currencyBalances)
  const [tradeToConfirm, setTradeToConfirm] = useState<PriceOrder | undefined>(undefined)
  const [indirectlyOpenConfirmModalState, setIndirectlyOpenConfirmModalState] = useState(false)

  // FIXME: using order as fallback here simply to avoid empty permit2 detail
  // Need to fetch permit2 information on the fly instead
  const orderToExecute = useMemo(
    () => (isExpertMode ? order : tradeToConfirm?.trade ? tradeToConfirm : order),
    [isExpertMode, order, tradeToConfirm],
  )
  const slippageAdjustedAmounts = useSlippageAdjustedAmounts(orderToExecute)
  const amountToApprove = useMemo(
    () =>
      inputCurrency?.isNative
        ? isXOrder(orderToExecute)
          ? slippageAdjustedAmounts[Field.INPUT]
          : undefined
        : slippageAdjustedAmounts[Field.INPUT],
    [inputCurrency?.isNative, orderToExecute, slippageAdjustedAmounts],
  )

  const { callToAction, confirmState, txHash, orderHash, confirmActions, errorMessage, resetState } =
    useConfirmModalState(orderToExecute, amountToApprove?.wrapped, getUniversalRouterAddress(chainId))

  const { onUserInput } = useSwapActionHandlers()
  const reset = useCallback(() => {
    afterCommit?.()
    setTradeToConfirm(undefined)
    if (confirmState === ConfirmModalState.COMPLETED) {
      onUserInput(Field.INPUT, '')
    }
    resetState()
  }, [afterCommit, confirmState, onUserInput, resetState])

  const handleAcceptChanges = useCallback(() => {
    setTradeToConfirm(order)
  }, [order])

  const hasNoValidRouteError = useMemo(() => Boolean(tradeError && isSupportedErrorType(tradeError)), [tradeError])

  const noRoute = useMemo(
    () => (isClassicOrder(order) && !((order.trade?.routes?.length ?? 0) > 0)) || hasNoValidRouteError,
    [order, hasNoValidRouteError],
  )
  const isValid = useMemo(() => !swapInputError && !tradeLoading, [swapInputError, tradeLoading])
  const disabled = useMemo(
    () => !isValid || (priceImpactSeverity > 3 && !isExpertMode) || isRecipientEmpty || isRecipientError,
    [isExpertMode, isRecipientEmpty, isRecipientError, isValid, priceImpactSeverity],
  )

  const userHasSpecifiedInputOutput = Boolean(
    inputCurrency && outputCurrency && parsedIndependentFieldAmount?.greaterThan(BIG_INT_ZERO),
  )

  // Get the refresh function from useAddressBalance to update balances after swap
  const { refresh: refreshBalances } = useAddressBalance(account, { enabled: false })

  const onConfirm = useCallback(() => {
    beforeCommit?.()
    logGTMClickSwapConfirmEvent()
    callToAction()
  }, [beforeCommit, callToAction])

  // modals
  const onSettingModalDismiss = useCallback(() => {
    setIndirectlyOpenConfirmModalState(true)
  }, [])
  const openSettingModal = useSettingModal(onSettingModalDismiss)
  const [openConfirmSwapModal] = useModal(
    <ConfirmSwapModalV2
      order={order}
      orderHash={orderHash}
      originalOrder={tradeToConfirm}
      txHash={txHash}
      confirmModalState={confirmState}
      pendingModalSteps={confirmActions ?? []}
      swapErrorMessage={errorMessage}
      currencyBalances={currencyBalances}
      onAcceptChanges={handleAcceptChanges}
      onConfirm={onConfirm}
      openSettingModal={openSettingModal}
      customOnDismiss={reset}
    />,
    true,
    true,
    'confirmSwapModalV2',
  )

  const handleSwap = useCallback(() => {
    setTradeToConfirm(order)
    resetState()

    // if expert mode turn-on, will not show preview modal
    // start swap directly
    if (isExpertMode) {
      onConfirm()
    }

    openConfirmSwapModal()
    logGTMClickSwapEvent()
  }, [isExpertMode, onConfirm, openConfirmSwapModal, resetState, order])

  useEffect(() => {
    if (indirectlyOpenConfirmModalState) {
      setIndirectlyOpenConfirmModalState(false)
      openConfirmSwapModal()
    }
  }, [indirectlyOpenConfirmModalState, openConfirmSwapModal])

  // Keep track of processed txHashes to avoid duplicate refreshes using a ref
  const processedTxHashesRef = useRef<string[]>([])

  // Watch for completed transactions and refresh balances
  useEffect(() => {
    // Only refresh when transaction is completed, txHash exists, and hasn't been processed yet
    if (confirmState === ConfirmModalState.COMPLETED && txHash && !processedTxHashesRef.current.includes(txHash)) {
      // Add this txHash to the processed list
      processedTxHashesRef.current.push(txHash)

      // Refresh balances
      if (refreshBalances) {
        // delay refresh balances
        setTimeout(() => {
          refreshBalances()
        }, 15000)
      }
    }
  }, [confirmState, txHash, refreshBalances])

  const buttonText = useMemo(() => {
    if (isRecipientEmpty) return t('Enter a recipient')
    if (isRecipientError) return t('Invalid recipient')
    return (
      swapInputError ||
      (tradeLoading && <Dots>{t('Searching For The Best Price')}</Dots>) ||
      (priceImpactSeverity > 3 && !isExpertMode
        ? t('Price Impact Too High')
        : priceImpactSeverity > 2
        ? t('Swap Anyway')
        : t('Swap'))
    )
  }, [isExpertMode, isRecipientEmpty, isRecipientError, priceImpactSeverity, swapInputError, t, tradeLoading])

  if (noRoute && userHasSpecifiedInputOutput && tradeError instanceof TimeoutError) {
    return <TimeoutButton />
  }

  if (noRoute && userHasSpecifiedInputOutput && (hasNoValidRouteError || !tradeLoading)) {
    return <ResetRoutesButton />
  }

  return (
    <Box mt="0.25rem">
      <CommitButton
        id="swap-button"
        width="100%"
        data-dd-action-name="Swap commit button"
        variant={isValid && priceImpactSeverity > 2 && !errorMessage ? 'danger' : 'primary'}
        disabled={disabled}
        onClick={handleSwap}
      >
        {buttonText}
      </CommitButton>
    </Box>
  )
})

const TimeoutButton = () => {
  const { refreshTrade, pauseQuoting, resumeQuoting } = useAtomValue(baseAllTypeBestTradeAtom)
  const { t } = useTranslation()

  const [seconds, setSeconds] = useState(3)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    pauseQuoting()
    timerRef.current = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          resume()
          return 3
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const resume = () => {
    resumeQuoting()
    refreshTrade()
  }

  const manualRetry = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    resume()
  }

  return (
    <AutoColumn gap="12px">
      <Message variant="warning" icon={<></>}>
        <AutoColumn gap="8px">
          <MessageText>{t('Routing timeout, will retry in %seconds%s...', { seconds })}</MessageText>
          <AutoRow gap="4px">
            <Button variant="text" scale="xs" p="0" onClick={manualRetry}>
              {t('Manual Retry')}
            </Button>
          </AutoRow>
        </AutoColumn>
      </Message>
    </AutoColumn>
  )
}
const ResetRoutesButton = () => {
  const { t } = useTranslation()
  const [isRoutingSettingChange, resetRoutingSetting] = useRoutingSettingChanged()
  return (
    <AutoColumn gap="12px">
      <GreyCard style={{ textAlign: 'center', padding: '0.75rem' }}>
        <Text color="textSubtle">{t('Insufficient liquidity for this trade.')}</Text>
      </GreyCard>
      {isRoutingSettingChange && (
        <Message variant="warning" icon={<></>}>
          <AutoColumn gap="8px">
            <MessageText>{t('Unable to establish trading route due to customized routing.')}</MessageText>
            <AutoRow gap="4px">
              <RoutingSettingsButton
                buttonProps={{
                  scale: 'xs',
                  p: 0,
                }}
                showRedDot={false}
              >
                {t('Check your settings')}
              </RoutingSettingsButton>
              <MessageText>{t('or')}</MessageText>
              <Button variant="text" scale="xs" p="0" onClick={resetRoutingSetting}>
                {t('Reset to default')}
              </Button>
            </AutoRow>
          </AutoColumn>
        </Message>
      )}
    </AutoColumn>
  )
}
