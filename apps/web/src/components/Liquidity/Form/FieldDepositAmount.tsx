import { useTranslation } from '@pancakeswap/localization'
import { Currency, Percent } from '@pancakeswap/swap-sdk-core'
import { AutoColumn, Box, BoxProps, PreTitle } from '@pancakeswap/uikit'
import CurrencyInputPanelV2 from 'components/CurrencyInputPanel/CurrencyInputPanelV2'
import { useMaxAmount } from 'hooks/useMaxAmount'
import { useCallback, useMemo } from 'react'
import { useInverted } from 'state/infinity/shared'

type FieldDepositAmountProps = BoxProps & {
  chainId: number | undefined
  baseCurrency: Currency | undefined
  quoteCurrency: Currency | undefined
  handleDepositAmountChange: (amount: string, index: 0 | 1) => void
  inputValue0: string | undefined
  inputValue1: string | undefined
  isDepositEnabled: boolean
  isDeposit0Enabled: boolean
  isDeposit1Enabled: boolean
  addOnly?: boolean
}

export const FieldDepositAmount: React.FC<FieldDepositAmountProps> = ({
  chainId,
  baseCurrency,
  quoteCurrency,
  handleDepositAmountChange,
  inputValue0,
  inputValue1,
  addOnly,
  isDepositEnabled,
  isDeposit0Enabled,
  isDeposit1Enabled,
  ...boxProps
}) => {
  const { t } = useTranslation()
  const [inverted] = useInverted()
  const maxAmountBase = useMaxAmount(baseCurrency)
  const maxAmountQuote = useMaxAmount(quoteCurrency)

  const handleUserInputBaseCurrency = useCallback(
    (amount: string) => {
      handleDepositAmountChange(amount, inverted ? 1 : 0)
    },
    [inverted, handleDepositAmountChange],
  )

  const handleUserInputQuoteCurrency = useCallback(
    (amount: string) => {
      handleDepositAmountChange(amount, inverted ? 0 : 1)
    },
    [inverted, handleDepositAmountChange],
  )

  const [isDepositBaseEnabled, isDepositQuoteEnabled] = useMemo(() => {
    return inverted ? [isDeposit1Enabled, isDeposit0Enabled] : [isDeposit0Enabled, isDeposit1Enabled]
  }, [inverted, isDeposit0Enabled, isDeposit1Enabled])
  const [inputValueBase, inputValueQuote] = useMemo(() => {
    return inverted ? [inputValue1, inputValue0] : [inputValue0, inputValue1]
  }, [inverted, inputValue0, inputValue1])

  return (
    <Box {...boxProps}>
      <AutoColumn gap="8px">
        <PreTitle>{t('Deposit Amount')}</PreTitle>
        <CurrencyInputPanelV2
          id="infinity-add-liquidity-input-base-currency"
          chainId={chainId}
          onUserInput={handleUserInputBaseCurrency}
          value={
            isDepositEnabled
              ? isDepositBaseEnabled
                ? inputValueBase ?? ''
                : addOnly
                ? t('The price range is outside current pool price')
                : t('The starting price is outside the specified price range')
              : addOnly
              ? t('Set price range first')
              : t('Set starting price and price range first')
          }
          currency={baseCurrency}
          onPercentInput={(percent) =>
            handleUserInputBaseCurrency(maxAmountBase?.multiply(new Percent(percent, 100))?.toExact() ?? '')
          }
          maxAmount={maxAmountBase}
          onMax={() => handleUserInputBaseCurrency(maxAmountBase?.toExact() ?? '')}
          showUSDPrice
          showMaxButton
          showQuickInputButton
          disableCurrencySelect
          disabled={!isDepositEnabled || !isDepositBaseEnabled}
        />
        <CurrencyInputPanelV2
          id="infinity-add-liquidity-input-quote-currency"
          chainId={chainId}
          onUserInput={handleUserInputQuoteCurrency}
          value={
            isDepositEnabled
              ? isDepositQuoteEnabled
                ? inputValueQuote ?? ''
                : addOnly
                ? t('The price range is outside current pool price')
                : t('The starting price is outside the specified price range')
              : addOnly
              ? t('Set price range first')
              : t('Set starting price and price range first')
          }
          currency={quoteCurrency}
          onPercentInput={(percent) =>
            handleUserInputQuoteCurrency(maxAmountQuote?.multiply(new Percent(percent, 100))?.toExact() ?? '')
          }
          maxAmount={maxAmountQuote}
          onMax={() => handleUserInputQuoteCurrency(maxAmountQuote?.toExact() ?? '')}
          showUSDPrice
          showMaxButton
          showQuickInputButton
          disableCurrencySelect
          disabled={!isDepositEnabled || !isDepositQuoteEnabled}
        />
      </AutoColumn>
    </Box>
  )
}
