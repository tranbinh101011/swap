import { ChainId } from '@pancakeswap/chains'
import { Currency, getCurrencyAddress, Price } from '@pancakeswap/sdk'
import { STABLE_COIN } from '@pancakeswap/tokens'
import { getFullDecimalMultiplier } from '@pancakeswap/utils/getFullDecimalMultiplier'
import { SLOW_INTERVAL } from 'config/constants'
import { atom, useAtom, useAtomValue } from 'jotai'
import { atomFamily } from 'jotai/utils'
import { atomWithLoadable } from 'quoter/atom/atomWithLoadable'
import { useEffect, useMemo } from 'react'
import { multiplyPriceByAmount } from 'utils/prices'
import isUndefinedOrNull from '@pancakeswap/utils/isUndefinedOrNull'
import { useActiveChainId } from './useActiveChainId'

type UseStablecoinPriceConfig = {
  enabled?: boolean
  hideIfPriceImpactTooHigh?: boolean
}
const DEFAULT_CONFIG: UseStablecoinPriceConfig = {
  enabled: true,
  hideIfPriceImpactTooHigh: false,
}

const versionAtom = atomFamily((_: string) => atom(Math.floor(Date.now() / SLOW_INTERVAL)))

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

const getKey = (params: { currency?: Currency; chainId?: number; enabled?: boolean }) =>
  `${params.currency ? getCurrencyAddress(params.currency) : ''}:${params.chainId}:${params.enabled ?? true}`

const stableCoinPriceAtom = atomFamily(
  (params: StableCoinPriceParams) => {
    return atomWithLoadable(
      async (get) => {
        const enabled = params.enabled ?? true
        if (!params.currency || !enabled) {
          return undefined
        }
        get(versionAtom(getKey(params)))
        return queryStablecoinPrice(params.currency, params.chainId)
      },
      {
        placeHolderBehavior: 'stale',
      },
    )
  },
  (a, b) => {
    const hashA = getKey(a)
    const hashB = getKey(b)
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
  const { enabled } = { ...DEFAULT_CONFIG, ...config }

  const stableCoin = chainId && chainId in ChainId ? STABLE_COIN[chainId as ChainId] : undefined

  const shouldEnabled = Boolean(currency && enabled && currentChainId === chainId)

  const version = Math.floor(Date.now() / SLOW_INTERVAL)

  const atomParams = useMemo(
    () => ({
      currency: currency || undefined,
      chainId,
      enabled,
    }),
    [currency, chainId, enabled],
  )

  const atomKey = useMemo(() => getKey(atomParams), [atomParams])

  const [, setVersion] = useAtom(versionAtom(atomKey))

  const coinPrice = useAtomValue(stableCoinPriceAtom(atomParams))

  useEffect(() => {
    setVersion(version)
  }, [version, setVersion])

  const price = useMemo(() => {
    if (!coinPrice || !currency || !stableCoin || !shouldEnabled) {
      return undefined
    }

    const isValidLoadable = coinPrice.isJust() || coinPrice.isPending()

    if (!isValidLoadable) {
      return undefined
    }

    const priceUSD = coinPrice.isJust() ? coinPrice.unwrap() : coinPrice.value

    if (isUndefinedOrNull(priceUSD)) return undefined

    return new Price(
      currency,
      stableCoin,
      1 * 10 ** currency.decimals,
      getFullDecimalMultiplier(stableCoin.decimals).times(priceUSD!.toFixed(stableCoin.decimals)).toString(),
    )
  }, [coinPrice, currency, stableCoin, shouldEnabled])

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
  const stablePrice = useStablecoinPrice(currency, { enabled: Boolean(currency && amount), ...config }, overrideChainId)

  return useMemo(() => {
    if (amount) {
      if (stablePrice) {
        return multiplyPriceByAmount(stablePrice, amount)
      }
    }
    return undefined
  }, [amount, stablePrice])
}
