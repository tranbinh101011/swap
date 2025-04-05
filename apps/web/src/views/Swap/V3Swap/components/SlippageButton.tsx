import { useTheme } from '@pancakeswap/hooks'
import { useTranslation } from '@pancakeswap/localization'
import { TradeType } from '@pancakeswap/sdk'
import { SmartRouterTrade, V4Router } from '@pancakeswap/smart-router'
import {
  Button,
  PencilIcon,
  RiskAlertIcon,
  Text,
  useMatchBreakpoints,
  useTooltip,
  WarningIcon,
} from '@pancakeswap/uikit'
import GlobalSettings from 'components/Menu/GlobalSettings'
import { SettingsMode } from 'components/Menu/GlobalSettings/types'
import { useAutoSlippageWithFallback } from 'hooks/useAutoSlippageWithFallback'
import { ReactElement, useMemo } from 'react'
import styled from 'styled-components'
import { basisPointsToPercent } from 'utils/exchange'

const TertiaryButton = styled(Button).attrs({ variant: 'tertiary' })<{ $color: string }>`
  height: unset;
  padding: 7px 8px;
  font-size: 14px;
  border-radius: 12px;
  border-bottom: 2px solid rgba(0, 0, 0, 0.1);
  color: ${({ $color }) => $color};
`

const AutoSlippageText = styled(Text)`
  font-size: 12px;
  margin-top: 4px;
  color: ${({ theme }) => theme.colors.textSubtle};
`

interface SlippageButtonProps {
  slippage?: number | ReactElement
  trade?: SmartRouterTrade<TradeType> | V4Router.V4TradeWithoutGraph<TradeType>
}

export const SlippageButton = ({ slippage, trade }: SlippageButtonProps) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { isMobile } = useMatchBreakpoints()

  // Calculate auto slippage
  const { slippageTolerance, isAuto } = useAutoSlippageWithFallback(trade)

  const isRiskyLow = slippageTolerance < 50

  const isRiskyHigh = slippageTolerance > 100
  const isRiskyVeryHigh = slippageTolerance > 2000

  const { targetRef, tooltip, tooltipVisible } = useTooltip(
    !isAuto
      ? isRiskyLow
        ? t('Your transaction may fail. Reset settings to avoid potential loss')
        : isRiskyHigh
        ? t('Your transaction may be frontrun. Reset settings to avoid potential loss')
        : ''
      : '',
    { placement: 'top' },
  )

  const color = useMemo(() => {
    if (isAuto) return theme.colors.primary60
    return isRiskyVeryHigh
      ? theme.colors.failure
      : isRiskyLow || isRiskyHigh
      ? theme.colors.yellow
      : theme.colors.primary60
  }, [theme, isRiskyVeryHigh, isRiskyLow, isRiskyHigh, isAuto])

  return (
    <>
      <GlobalSettings
        id="slippage_btn_global_settings"
        key="slippage_btn_global_settings"
        mode={SettingsMode.SWAP_LIQUIDITY}
        overrideButton={(onClick) => (
          <div style={{ textAlign: 'center' }}>
            <div ref={!isMobile ? targetRef : undefined}>
              <TertiaryButton
                $color={color}
                startIcon={
                  !isAuto ? (
                    isRiskyVeryHigh ? (
                      <RiskAlertIcon color={color} width={16} />
                    ) : isRiskyLow || isRiskyHigh ? (
                      <WarningIcon color={color} width={16} />
                    ) : null
                  ) : null
                }
                endIcon={<PencilIcon color={color} width={12} />}
                onClick={onClick}
              >
                {isAuto && slippageTolerance
                  ? `${t('Auto')}: ${basisPointsToPercent(slippageTolerance).toFixed(2)}%`
                  : typeof slippage === 'number'
                  ? `${basisPointsToPercent(slippage).toFixed(2)}%`
                  : slippage}
              </TertiaryButton>
            </div>

            {!isAuto && (isRiskyLow || isRiskyHigh) && tooltipVisible && tooltip}
          </div>
        )}
      />
    </>
  )
}
