import { useTranslation } from '@pancakeswap/localization'
import { Currency, CurrencyAmount } from '@pancakeswap/sdk'
import tryParseAmount from '@pancakeswap/utils/tryParseAmount'

import { Field } from 'state/swap/actions'
import { useSwapState } from 'state/swap/hooks'
import { isAddressEqual, safeGetAddress } from 'utils'

import { ClassicOrder, PriceOrder } from '@pancakeswap/price-api-sdk'
import { isClassicOrder } from 'views/Swap/utils'
import { useAccount } from 'wagmi'
import { useSlippageAdjustedAmounts } from './useSlippageAdjustedAmounts'

interface Balances {
  [Field.INPUT]?: CurrencyAmount<Currency>
  [Field.OUTPUT]?: CurrencyAmount<Currency>
}

/**
 * Returns true if any of the pairs or tokens in a trade have the given checksummed address
 * @param trade to check for the given address
 * @param checksummedAddress address to check in the pairs and tokens
 */
function involvesAddress(trade: ClassicOrder['trade'], checksummedAddress: string): boolean {
  // TODO check for pools
  return trade.routes.some((r) =>
    r.path.some((token) => token.isToken && isAddressEqual(token.address, checksummedAddress)),
  )
}

// TODO: update
const BAD_RECIPIENT_ADDRESSES: string[] = [
  '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f', // v2 factory
  '0xf164fC0Ec4E93095b804a4795bBe1e041497b92a', // v2 router 01
  '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', // v2 router 02
]

export function useSwapInputError(order: PriceOrder | undefined, currencyBalances: Balances): string | undefined {
  const { t } = useTranslation()
  const { address: account, connector } = useAccount()
  const { independentField, typedValue } = useSwapState()
  const inputCurrency = currencyBalances[Field.INPUT]?.currency
  const outputCurrency = currencyBalances[Field.OUTPUT]?.currency
  const slippageAdjustedAmounts = useSlippageAdjustedAmounts(order)

  const to: string | null = account || null

  console.log('🔍 [useSwapInputError] Account check (Custom Connector):', { 
    account: account || 'none', 
    connectorId: connector?.id,
    connectorName: connector?.name,
    to: to || 'none'
  })

  const isExactIn: boolean = independentField === Field.INPUT
  const independentCurrency = isExactIn ? inputCurrency : outputCurrency
  const parsedAmount = tryParseAmount(typedValue, independentCurrency ?? undefined)

  let inputError: string | undefined
  if (!account) {
    console.log('❌ [useSwapInputError] No active account - Connect Wallet')
    inputError = t('Connect Wallet')
  }

  if (!parsedAmount) {
    console.log('❌ [useSwapInputError] No parsed amount - Enter an amount')
    inputError = inputError ?? t('Enter an amount')
  }

  if (!inputCurrency || !outputCurrency) {
    console.log('❌ [useSwapInputError] Missing currency - Select a token')
    inputError = inputError ?? t('Select a token')
  }

  const formattedTo = safeGetAddress(to)
  if (!to || !formattedTo) {
    console.log('❌ [useSwapInputError] No recipient - Enter a recipient')
    inputError = inputError ?? t('Enter a recipient')
  } else if (
    BAD_RECIPIENT_ADDRESSES.indexOf(formattedTo) !== -1 ||
    (isClassicOrder(order) && order.trade && involvesAddress(order.trade, formattedTo))
  ) {
    console.log('❌ [useSwapInputError] Invalid recipient')
    inputError = inputError ?? t('Invalid recipient')
  }

  // compare input balance to max input based on version
  // use the actual input amount instead of the slippage adjusted amount
  const balanceIn = currencyBalances[Field.INPUT]
  const actualInputAmount = order?.trade?.inputAmount

  if (balanceIn && actualInputAmount && balanceIn.lessThan(actualInputAmount)) {
    console.log('❌ [useSwapInputError] Insufficient balance:', { 
      balance: balanceIn.toExact(), 
      required: actualInputAmount.toExact() 
    })
    inputError = t('Insufficient %symbol% balance', { symbol: actualInputAmount.currency.symbol })
  }

  console.log('🎯 [useSwapInputError] Final result:', inputError || 'none')
  return inputError || ''
}
