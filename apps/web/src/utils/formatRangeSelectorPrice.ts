import { Currency, Price } from '@pancakeswap/swap-sdk-core'

export const formatRangeSelectorPrice = (price: Price<Currency, Currency> | undefined) => {
  if (!price) return ''

  return price.greaterThan(1) ? price.toFixed(2) : price.toSignificant(9)
}
