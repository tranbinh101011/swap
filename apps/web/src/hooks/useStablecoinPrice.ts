import { ChainId } from '@pancakeswap/chains'
import { Currency, getCurrencyAddress, Price } from '@pancakeswap/sdk'
import { STABLE_COIN } from '@pancakeswap/tokens'
import { getFullDecimalMultiplier } from '@pancakeswap/utils/getFullDecimalMultiplier'
import { atom, useAtomValue } from 'jotai'
import { atomFamily } from 'jotai/utils'
import { useMemo } from 'react'
import { multiplyPriceByAmount } from 'utils/prices'
import { useActiveChainId } from './useActiveChainId'

type UseStablecoinPriceConfig = {
  enabled?: boolean
  hideIfPriceImpactTooHigh?: boolean
}
const DEFAULT_CONFIG: UseStablecoinPriceConfig = {
  enabled: true,
  hideIfPriceImpactTooHigh: false,
}

const queryStablecoinPrice = async (currency: Currency, overrideChainId?: number) => {
  if (!currency) throw new Error('No currency')
  const chainId = currency.chainId || overrideChainId
  if (!chainId) throw new Error('No chainId provided')
  const stableCoin = chainId in ChainId ? STABLE_COIN[chainId as ChainId] : undefined
  if (!stableCoin) throw new Error('No stable coin')
  const params = new URLSearchParams({ chainId: String(chainId) })
  if (currency.isNative) {
    params.set('native', 'true')
  } else {
    params.set('address', currency.wrapped.address)
  }
  const res = await fetch(`/api/token/price?${params.toString()}`)
  if (!res.ok) {
    throw new Error('request failed')
  }
  const json = await res.json()
  return json.priceUSD as number | undefined
}

interface StableCoinPriceParams {
  currency?: Currency
  chainId?: number
  enabled?: boolean
}
const stableCoinPriceAtom = atomFamily(
  (params: StableCoinPriceParams) => {
    return atom(async () => {
      const enabled = params.enabled ?? true
      if (!params.currency || !enabled) {
        return undefined
      }
      return queryStablecoinPrice(params.currency, params.chainId)
    })
  },
  (a, b) => {
    const hashA = `${a.currency ? getCurrencyAddress(a.currency) : ''}:${a.chainId}:${a.enabled}`
    const hashB = `${b.currency ? getCurrencyAddress(b.currency) : ''}:${b.chainId}:${b.enabled}`
    return hashA === hashB
  },
)

export function useStablecoinPrice(
  currency?: Currency | null,
  config: UseStablecoinPriceConfig = DEFAULT_CONFIG,
  overrideChainId?: number,
): Price<Currency, Currency> | undefined {
  const { chainId: activeChainId } = useActiveChainId()
  const currentChainId = overrideChainId || activeChainId

  const chainId = currency?.chainId || activeChainId
  const { enabled, hideIfPriceImpactTooHigh } = { ...DEFAULT_CONFIG, ...config }

  const stableCoin = chainId && chainId in ChainId ? STABLE_COIN[chainId as ChainId] : undefined

  const shouldEnabled = Boolean(currency && enabled && currentChainId === chainId)

  const priceUSD = useAtomValue(
    stableCoinPriceAtom({
      currency: currency || undefined,
      chainId,
      enabled,
    }),
  )

  const price = useMemo(() => {
    if (!priceUSD || !currency || !stableCoin || !shouldEnabled) {
      return undefined
    }

    return new Price(
      currency,
      stableCoin,
      1 * 10 ** currency.decimals,
      getFullDecimalMultiplier(stableCoin.decimals).times(priceUSD.toFixed(stableCoin.decimals)).toString(),
    )
  }, [currency, stableCoin, shouldEnabled, priceUSD])

  if (price?.denominator === 0n) {
    return undefined
  }

  return price
}

export const useStablecoinPriceAmount = (
  currency?: Currency,
  amount?: number,
  config?: UseStablecoinPriceConfig,
  overrideChainId?: number,
): number | undefined => {
  const stablePrice = useStablecoinPrice(currency, { enabled: !!currency, ...config }, overrideChainId)

  return useMemo(() => {
    if (amount) {
      if (stablePrice) {
        return multiplyPriceByAmount(stablePrice, amount)
      }
    }
    return undefined
  }, [amount, stablePrice])
}
