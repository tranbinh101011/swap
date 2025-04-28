import { Currency } from '@pancakeswap/swap-sdk-core'
import { BoxProps } from '@pancakeswap/uikit'
import { FieldDepositAmount } from 'components/Liquidity/Form/FieldDepositAmount'
import { useInfinityPoolIdRouteParams } from 'hooks/dynamicRoute/usePoolIdRoute'
import { useAddDepositAmounts, useAddDepositAmountsEnabled } from '../hooks/useAddDepositAmounts'

type FieldDepositAmountProps = BoxProps & {
  baseCurrency: Currency | undefined
  quoteCurrency: Currency | undefined
}

export const FieldAddDepositAmount: React.FC<FieldDepositAmountProps> = ({
  baseCurrency,
  quoteCurrency,
  ...boxProps
}) => {
  const { chainId } = useInfinityPoolIdRouteParams()
  const { inputValue0, inputValue1, handleDepositAmountChange } = useAddDepositAmounts()
  const { isDepositEnabled, isDeposit0Enabled, isDeposit1Enabled } = useAddDepositAmountsEnabled()

  return (
    <FieldDepositAmount
      {...boxProps}
      addOnly
      chainId={chainId}
      baseCurrency={baseCurrency}
      quoteCurrency={quoteCurrency}
      handleDepositAmountChange={handleDepositAmountChange}
      inputValue0={inputValue0}
      inputValue1={inputValue1}
      isDeposit0Enabled={isDeposit0Enabled}
      isDepositEnabled={isDepositEnabled}
      isDeposit1Enabled={isDeposit1Enabled}
    />
  )
}
