import { useTranslation } from '@pancakeswap/localization'
import { Box, PreTitle, RowBetween, ScanLink } from '@pancakeswap/uikit'
import { Liquidity } from '@pancakeswap/widgets-internal'
import { useLiquidityShapeQueryState } from 'state/infinity/shared'

export const BinLiquidityShapeSelector = () => {
  const { t } = useTranslation()
  const [liquidityShape, setLiquidityShape] = useLiquidityShapeQueryState()

  return (
    <Box mt="24px">
      <RowBetween>
        <PreTitle>{t('Choose Liquidity Shape')}</PreTitle>
        <ScanLink href="#" fontSize="12px">
          {t('LEARN MORE')}
        </ScanLink>
      </RowBetween>

      <Liquidity.LiquidityShapePicker mt="8px" value={liquidityShape} onChange={setLiquidityShape} />
    </Box>
  )
}
