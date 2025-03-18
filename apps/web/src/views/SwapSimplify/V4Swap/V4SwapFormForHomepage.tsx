import { OrderType } from '@pancakeswap/price-api-sdk'
import { SmartRouter } from '@pancakeswap/smart-router/evm'
import { SwapUIV2 } from '@pancakeswap/widgets-internal'
import { useCurrency } from 'hooks/Tokens'
import { useActiveChainId } from 'hooks/useActiveChainId'
import { useCurrencyUsdPrice } from 'hooks/useCurrencyUsdPrice'
import { usePaymaster } from 'hooks/usePaymaster'
import { useMemo } from 'react'
import { Field } from 'state/swap/actions'
import { useSwapState } from 'state/swap/hooks'
import { logger } from 'utils/datadog'
import { useAllTypeBestTrade } from '../../Swap/V3Swap/hooks/useAllTypeBestTrade'
import { useUserInsufficientBalance } from '../hooks/useUserInsufficientBalance'
import { ButtonAndDetailsPanel } from './ButtonAndDetailsPanel'
import { CommitButton } from './CommitButton'
import { FormMainForHomePage } from './FormMainV4ForHomePage'
import { SwapCommitButton } from './SwapCommitButtonForHomepage'

export function V4SwapFormForHomePage() {
  const {
    betterOrder,
    bestOrder,
    refreshOrder,
    tradeError,
    tradeLoaded,
    refreshDisabled,
    pauseQuoting,
    resumeQuoting,
    xOrder,
    ammOrder,
  } = useAllTypeBestTrade()

  const { chainId: activeChianId } = useActiveChainId()
  const isUserInsufficientBalance = useUserInsufficientBalance(bestOrder)

  const { data: inputUsdPrice } = useCurrencyUsdPrice(bestOrder?.trade?.inputAmount.currency)
  const { data: outputUsdPrice } = useCurrencyUsdPrice(bestOrder?.trade?.outputAmount.currency)

  const executionPrice = useMemo(
    () => (bestOrder?.trade ? SmartRouter.getExecutionPrice(bestOrder.trade) : undefined),
    [bestOrder?.trade],
  )

  const commitHooks = useMemo(() => {
    return {
      beforeCommit: () => {
        pauseQuoting()
        try {
          const validTrade = ammOrder?.trade ?? xOrder?.trade
          if (!validTrade) {
            throw new Error('No valid trade to log')
          }
          const { inputAmount, tradeType, outputAmount } = validTrade
          const { currency: inputCurrency } = inputAmount
          const { currency: outputCurrency } = outputAmount
          const { chainId } = inputCurrency
          const ammInputAmount = ammOrder?.trade?.inputAmount.toExact()
          const ammOutputAmount = ammOrder?.trade?.outputAmount.toExact()
          const xInputAmount = xOrder?.trade?.inputAmount.toExact()
          const xOutputAmount = xOrder?.trade?.outputAmount.toExact()
          logger.info('X/AMM Quote Comparison', {
            chainId,
            tradeType,
            inputNative: inputCurrency.isNative,
            outputNative: outputCurrency.isNative,
            inputToken: inputCurrency.wrapped.address,
            outputToken: outputCurrency.wrapped.address,
            bestOrderType: betterOrder?.type,
            ammOrder: {
              type: ammOrder?.type,
              inputAmount: ammInputAmount,
              outputAmount: ammOutputAmount,
              inputUsdValue: inputUsdPrice && ammInputAmount ? Number(ammInputAmount) * inputUsdPrice : undefined,
              outputUsdValue: outputUsdPrice && ammOutputAmount ? Number(ammOutputAmount) * outputUsdPrice : undefined,
            },
            xOrder: xOrder
              ? {
                  filler: xOrder.type === OrderType.DUTCH_LIMIT ? xOrder.trade.orderInfo.exclusiveFiller : undefined,
                  type: xOrder.type,
                  inputAmount: xInputAmount,
                  outputAmount: xOutputAmount,
                  inputUsdValue: inputUsdPrice && xInputAmount ? Number(xInputAmount) * inputUsdPrice : undefined,
                  outputUsdValue: outputUsdPrice && xOutputAmount ? Number(xOutputAmount) * outputUsdPrice : undefined,
                }
              : undefined,
          })
        } catch (error) {
          //
        }
      },
      afterCommit: resumeQuoting,
    }
  }, [pauseQuoting, resumeQuoting, xOrder, ammOrder, inputUsdPrice, outputUsdPrice, betterOrder?.type])
  const {
    [Field.INPUT]: { currencyId: inputCurrencyId },
  } = useSwapState()

  const inputCurrency = useCurrency(inputCurrencyId)

  const { isPaymasterAvailable } = usePaymaster()

  return (
    <SwapUIV2.SwapFormWrapper
      style={{
        marginBottom: 0,
      }}
    >
      <SwapUIV2.SwapTabAndInputPanelWrapper>
        <FormMainForHomePage
          tradeLoading={!tradeLoaded}
          inputAmount={bestOrder?.trade?.inputAmount}
          outputAmount={bestOrder?.trade?.outputAmount}
          swapCommitButton={
            <CommitButton order={bestOrder} tradeLoaded={tradeLoaded} tradeError={tradeError} {...commitHooks} />
          }
          isUserInsufficientBalance={isUserInsufficientBalance}
        />
      </SwapUIV2.SwapTabAndInputPanelWrapper>
      <ButtonAndDetailsPanel
        swapCommitButton={
          <SwapCommitButton order={bestOrder} tradeLoading={!tradeLoaded} tradeError={tradeError} {...commitHooks} />
        }
        pricingAndSlippage={null}
        tradeDetails={null}
        shouldRenderDetails={false}
        gasTokenSelector={null}
      />
    </SwapUIV2.SwapFormWrapper>
  )
}
