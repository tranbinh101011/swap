import { Currency, getCurrencyAddress, sortCurrencies } from '@pancakeswap/swap-sdk-core'
import { keccak256, stringify } from 'viem/utils'
import { PoolQuery, QuoteQuery, StrategyQuery } from '../quoter.types'

export class PoolHashHelper {
  static hashCurrenciesWithSort(a?: Currency, b?: Currency) {
    const list: Currency[] = []
    if (a) {
      list.push(a)
    }
    if (b && !isEqualCurrency(a, b)) {
      list.push(b)
    }

    const sorted = sortCurrencies(list)
    const str = sorted.map((currency) => getCurrencyAddress(currency)).join(',')
    const hash = keccak256(`0x${str}`)
    return hash
  }

  static hashCurrencies(a?: Currency, b?: Currency) {
    const list: Currency[] = []
    if (a) {
      list.push(a)
    }
    if (b && !isEqualCurrency(a, b)) {
      list.push(b)
    }
    const str = list.map((currency) => getCurrencyAddress(currency)).join(',')
    const hash = keccak256(`0x${str}`)
    return hash
  }

  static hashPoolQuery = (query: PoolQuery) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { currencyA, currencyB, signal, provider, options, ...rest } = query
    try {
      const hash = PoolHashHelper.hashCurrenciesWithSort(currencyA, currencyB)
      const hashRest = keccak256(`0x${stringify(rest)}`)
      return keccak256(`${hash}-$${hashRest}`)
    } catch (ex) {
      console.error(ex, 'error: with query', query)
      throw ex
    }
  }

  static hashQuoteQuery = (query: QuoteQuery) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {
      amount,
      currency,
      slippage,
      controller,
      blockNumber,
      provider,
      signal,
      createTime,
      hash,
      placeholderHash,
      ...rest
    } = query
    const chainId = query.baseCurrency?.chainId
    const restHash = keccak256(`0x${stringify(rest)}:${chainId}`)
    const hashCurrencies = PoolHashHelper.hashCurrencies(amount?.currency, currency || undefined)
    const prts = [amount?.toExact(), hashCurrencies, restHash]
    return keccak256(`0x${prts.join(':')}`)
  }

  static hashStrategyQuery = (query: StrategyQuery) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { baseCurrency, quoteCurrency, ...rest } = query
    const hashCurrencies = PoolHashHelper.hashCurrencies(baseCurrency, quoteCurrency)
    const restHash = keccak256(`0x${stringify(rest)}`)
    return keccak256(`${hashCurrencies}-$${restHash}`)
  }
}

export const isEqualCurrency = (a: Currency | undefined, b: Currency | undefined) => {
  if (a === b) {
    return true
  }
  if (!a || !b) {
    return false
  }
  return getCurrencyAddress(a) === getCurrencyAddress(b)
}

export const isEqualQuoteQuery = (a: QuoteQuery, b: QuoteQuery) => {
  return a.hash === b.hash
}

export const isEqualPoolQuery = (a: PoolQuery, b: PoolQuery) => {
  return PoolHashHelper.hashPoolQuery(a) === PoolHashHelper.hashPoolQuery(b)
}
