import { ExclusiveDutchOrderTrade } from '@pancakeswap/pcsx-sdk'
import { SmartRouterTrade, V4Router } from '@pancakeswap/smart-router'
import { Currency, CurrencyAmount, TradeType } from '@pancakeswap/swap-sdk-core'
import { useUserSlippage } from '@pancakeswap/utils/user'
import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { useMemo } from 'react'
import useClassicAutoSlippageTolerance, { useInputBasedAutoSlippage } from './useAutoSlippage'

// Atom to store the user's preference for auto slippage
const autoSlippageEnabledAtom = atomWithStorage('pcs:auto-slippage-enabled-2', true)

export const useAutoSlippageEnabled = () => {
  return useAtom(autoSlippageEnabledAtom)
}

type SupportedTrade =
  | SmartRouterTrade<TradeType>
  | V4Router.V4TradeWithoutGraph<TradeType>
  | ExclusiveDutchOrderTrade<Currency, Currency>

/**
 * Returns the slippage tolerance based on user settings or auto-calculated value
 * If auto slippage is enabled, it will use the auto-calculated value
 * Otherwise, it will use the user's manually set slippage
 */
export function useAutoSlippageWithFallback(trade?: SupportedTrade): {
  slippageTolerance: number
  isAuto: boolean
} {
  const [isAutoSlippageEnabled] = useAutoSlippageEnabled()
  const [userSlippageTolerance] = useUserSlippage()
  const autoSlippageTolerance = useClassicAutoSlippageTolerance(trade)
  const isXOrder = Boolean((trade as ExclusiveDutchOrderTrade<Currency, Currency>)?.orderInfo)

  return useMemo(() => {
    if (isAutoSlippageEnabled && trade && !isXOrder) {
      return {
        slippageTolerance: Number(autoSlippageTolerance.numerator),
        isAuto: true,
      }
    }

    // Convert basis points to percent
    const userSlippageTolerancePercent = userSlippageTolerance

    return {
      slippageTolerance: userSlippageTolerancePercent,
      isAuto: false,
    }
  }, [isAutoSlippageEnabled, trade, autoSlippageTolerance, userSlippageTolerance])
}

export const useInputBasedAutoSlippageWithFallback = (inputAmount?: CurrencyAmount<Currency>) => {
  const [isAutoSlippageEnabled] = useAutoSlippageEnabled()
  const [userSlippageTolerance] = useUserSlippage()
  const autoSlippageTolerance = useInputBasedAutoSlippage(inputAmount)

  return useMemo(() => {
    if (isAutoSlippageEnabled && inputAmount) {
      return {
        slippageTolerance: Number(autoSlippageTolerance.numerator),
        isAuto: true,
      }
    }

    return {
      slippageTolerance: userSlippageTolerance,
      isAuto: false,
    }
  }, [isAutoSlippageEnabled, inputAmount, autoSlippageTolerance, userSlippageTolerance])
}
