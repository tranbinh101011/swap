import { ChainId } from '@pancakeswap/chains'
import { ExclusiveDutchOrderTrade } from '@pancakeswap/pcsx-sdk'
import { Percent, TradeType } from '@pancakeswap/sdk'
import { SmartRouterTrade, V4Router } from '@pancakeswap/smart-router'
import { Currency, CurrencyAmount } from '@pancakeswap/swap-sdk-core'
import { BigNumber } from 'bignumber.js'
import { L2_CHAIN_IDS } from 'config/chains'
import { useActiveChainId } from 'hooks/useActiveChainId'
import { useMemo } from 'react'

import { useGasPrice } from '../state/user/hooks'
import useNativeCurrency from './useNativeCurrency'
import { useStablecoinPrice, useStablecoinPriceAmount } from './useStablecoinPrice'

const DEFAULT_AUTO_SLIPPAGE = new Percent(50, 10_000) // 0.5%
const MIN_AUTO_SLIPPAGE_TOLERANCE = new Percent(50, 10_000) // 0.5%
const MAX_AUTO_SLIPPAGE_TOLERANCE = new Percent(550, 10_000) // 5.5%

// Helper functions
const isL2ChainId = (chainId?: number): boolean => {
  if (!chainId) return false
  return L2_CHAIN_IDS.includes(chainId)
}

const chainSupportsGasEstimates = (chainId?: number): boolean => {
  if (!chainId) return false
  return chainId === ChainId.ETHEREUM || chainId === ChainId.BSC
}

// Type guard to check if trade is V4Trade
const isV4Trade = (
  trade:
    | SmartRouterTrade<TradeType>
    | V4Router.V4TradeWithoutGraph<TradeType>
    | ExclusiveDutchOrderTrade<Currency, Currency>
    | undefined,
): trade is V4Router.V4TradeWithoutGraph<TradeType> => {
  return trade !== undefined && trade !== null && 'gasUseEstimate' in trade && !('orderInfo' in trade)
}

// Estimate gas for a trade
const guesstimateGas = (
  trade?:
    | SmartRouterTrade<TradeType>
    | V4Router.V4TradeWithoutGraph<TradeType>
    | ExclusiveDutchOrderTrade<Currency, Currency>,
): number => {
  if (!trade) return 0
  // A very rough gas estimation based on the trade type
  return 200000 // Default gas estimate
}

// Calculate gas estimate in USD based on trade type
const calculateGasEstimateUSD = (
  supportsGasEstimate: boolean,
  trade?:
    | SmartRouterTrade<TradeType>
    | V4Router.V4TradeWithoutGraph<TradeType>
    | ExclusiveDutchOrderTrade<Currency, Currency>,
  baseGasEstimatePrice?: any,
) => {
  if (!supportsGasEstimate || !trade) return null

  if (isV4Trade(trade)) {
    // For V4Trade, use gasUseEstimateBase and convert to USD
    const baseGasEstimate = trade.gasUseEstimateBase
    if (baseGasEstimate && baseGasEstimatePrice) {
      const baseAmount = parseFloat(baseGasEstimate.toSignificant(6))
      return baseAmount * parseFloat(baseGasEstimatePrice.toSignificant(6))
    }
    return null
  }

  // For ExclusiveDutchOrderTrade, use a default gas estimate
  if ('orderInfo' in trade) {
    // This is an ExclusiveDutchOrderTrade
    return 0.5 // Default gas cost in USD for Dutch Order trades
  }

  // For SmartRouterTrade, use gasEstimateInUSD
  return 'gasEstimateInUSD' in trade
    ? typeof trade.gasEstimateInUSD === 'string'
      ? parseFloat(trade.gasEstimateInUSD)
      : Number(trade.gasEstimateInUSD?.toSignificant(6))
    : null
}

// Calculate native gas cost
const calculateNativeGasCost = (nativeGasPrice?: string, gasEstimate?: number) => {
  return nativeGasPrice && typeof gasEstimate === 'number'
    ? new BigNumber(nativeGasPrice.toString()).multipliedBy(gasEstimate)
    : undefined
}

// Calculate gas cost amount
const calculateGasCostAmount = (nativeGasCost?: BigNumber, nativeCurrency?: any) => {
  return nativeGasCost && nativeCurrency
    ? parseFloat(nativeGasCost.toFixed(0)) / 10 ** nativeCurrency.decimals
    : undefined
}

// Calculate slippage based on dollar cost and output value
const calculateSlippageFromDollarValues = (dollarCostToUse: number, outputDollarValue: number) => {
  // Optimize for highest possible slippage without getting MEV'd
  // Set slippage % such that the difference between expected amount out and minimum amount out < gas fee to sandwich the trade
  const fraction = dollarCostToUse / outputDollarValue
  return new Percent(Math.floor(fraction * 10000), 10000)
}

// Apply slippage tolerance limits
const applySlippageLimits = (calculatedSlippage: Percent, min = 50, max = 550) => {
  if (calculatedSlippage.greaterThan(new Percent(max, 10_000))) {
    console.log('Auto Slippage: Using MAX_AUTO_SLIPPAGE_TOLERANCE', new Percent(max, 10_000).toFixed(2))
    return new Percent(max, 10_000)
  }

  if (calculatedSlippage.lessThan(new Percent(min, 10_000))) {
    console.log('Auto Slippage: Using MIN_AUTO_SLIPPAGE_TOLERANCE', new Percent(min, 10_000).toFixed(2))
    return new Percent(min, 10_000)
  }

  console.log('Auto Slippage: Using calculated result', calculatedSlippage.toFixed(2))
  return calculatedSlippage
}

type SupportedTrade =
  | SmartRouterTrade<TradeType>
  | V4Router.V4TradeWithoutGraph<TradeType>
  | ExclusiveDutchOrderTrade<Currency, Currency>

export default function useClassicAutoSlippageTolerance(trade?: SupportedTrade): Percent {
  const { chainId } = useActiveChainId()
  const onL2 = isL2ChainId(chainId)
  const inputBasedSlippage = useInputBasedAutoSlippage(trade?.inputAmount)

  // Get USD price of output amount
  const outputCurrency = trade?.outputAmount?.currency
  const outputUSDPrice = useStablecoinPrice(outputCurrency)
  const outputAmount = trade?.outputAmount?.toSignificant(6)
  const outputDollarValue =
    outputAmount && outputUSDPrice ? parseFloat(outputAmount) * parseFloat(outputUSDPrice.toSignificant(6)) : undefined

  // Gas estimation
  const supportsGasEstimate = useMemo(() => chainId && chainSupportsGasEstimates(chainId), [chainId])

  // Get base gas estimate currency price for V4 trades
  const baseGasEstimateCurrency = isV4Trade(trade) ? trade.gasUseEstimateBase?.currency : undefined
  const baseGasEstimatePrice = useStablecoinPrice(baseGasEstimateCurrency)

  // Get gas estimate in USD based on trade type
  const gasEstimateUSD = useMemo(
    () => calculateGasEstimateUSD(!!supportsGasEstimate, trade, baseGasEstimatePrice),
    [supportsGasEstimate, trade, baseGasEstimatePrice],
  )

  const nativeGasPrice = useGasPrice()
  const nativeCurrency = useNativeCurrency(chainId)
  const gasEstimate = guesstimateGas(trade)

  // Calculate native gas cost
  const nativeGasCost = useMemo(
    () => calculateNativeGasCost(nativeGasPrice?.toString(), gasEstimate),
    [nativeGasPrice, gasEstimate],
  )

  // Convert native gas cost to USD without using CurrencyAmount
  const gasCostAmount = useMemo(
    () => calculateGasCostAmount(nativeGasCost, nativeCurrency),
    [nativeGasCost, nativeCurrency],
  )

  // Always call the hook unconditionally
  const gasCostUSDValue = useStablecoinPriceAmount(nativeCurrency, gasCostAmount)

  return useMemo(() => {
    if (!trade || onL2) {
      console.log('Auto Slippage: Using DEFAULT_AUTO_SLIPPAGE because', !trade ? 'no trade' : 'on L2')
      return DEFAULT_AUTO_SLIPPAGE
    }

    // If valid estimate from API and using API trade, use gas estimate from API
    // NOTE - don't use gas estimate for L2s yet - need to verify accuracy
    // If not, use local heuristic
    const dollarCostToUse = supportsGasEstimate && gasEstimateUSD ? gasEstimateUSD : gasCostUSDValue

    if (outputDollarValue && dollarCostToUse) {
      const calculatedSlippage = calculateSlippageFromDollarValues(dollarCostToUse, outputDollarValue)

      console.info('Auto Slippage: Calculated result', {
        dollarCostToUse,
        outputDollarValue,
        fraction: dollarCostToUse / outputDollarValue,
        resultBasisPoints: Math.floor((dollarCostToUse / outputDollarValue) * 10000),
        result: calculatedSlippage.toFixed(2),
      })

      return calculatedSlippage.lessThan(inputBasedSlippage)
        ? inputBasedSlippage
        : applySlippageLimits(calculatedSlippage)
    }

    console.log('Auto Slippage: Using DEFAULT_AUTO_SLIPPAGE because missing outputDollarValue or dollarCostToUse')
    return DEFAULT_AUTO_SLIPPAGE
  }, [
    trade,
    onL2,
    supportsGasEstimate,
    gasEstimateUSD,
    gasCostUSDValue,
    outputDollarValue,
    chainId,
    nativeGasPrice,
    gasEstimate,
    outputCurrency,
    outputUSDPrice,
    outputAmount,
    nativeGasCost,
    gasCostAmount,
  ])
}

// Calculate slippage based on input dollar value
export function useInputBasedAutoSlippage(inputAmount?: CurrencyAmount<Currency>): Percent {
  const { chainId } = useActiveChainId()
  const onL2 = isL2ChainId(chainId)

  // Get USD price of input amount
  const inputCurrency = inputAmount?.currency
  const inputUSDPrice = useStablecoinPrice(inputCurrency)
  const inputAmountValue = inputAmount?.toSignificant(6)
  const inputDollarValue =
    inputAmountValue && inputUSDPrice
      ? parseFloat(inputAmountValue) * parseFloat(inputUSDPrice.toSignificant(6))
      : undefined

  // Gas estimation
  const supportsGasEstimate = useMemo(() => chainId && chainSupportsGasEstimates(chainId), [chainId])
  const nativeGasPrice = useGasPrice()
  const nativeCurrency = useNativeCurrency(chainId)

  // Use a fixed gas estimate for input-based calculation
  const gasEstimate = 200000 // Default gas estimate

  // Calculate native gas cost
  const nativeGasCost = useMemo(
    () => calculateNativeGasCost(nativeGasPrice?.toString(), gasEstimate),
    [nativeGasPrice, gasEstimate],
  )

  // Convert native gas cost to USD
  const gasCostAmount = useMemo(
    () => calculateGasCostAmount(nativeGasCost, nativeCurrency),
    [nativeGasCost, nativeCurrency],
  )

  // Get gas cost in USD
  const gasCostUSDValue = useStablecoinPriceAmount(nativeCurrency, gasCostAmount)

  return useMemo(() => {
    // If no input amount or on L2 chain, use default
    if (!inputAmount || onL2) {
      return DEFAULT_AUTO_SLIPPAGE
    }
    // If we have input dollar value and gas cost, calculate slippage
    if (inputDollarValue && gasCostUSDValue) {
      // For input-based calculation, we use a different formula
      // We want to ensure the slippage covers the gas cost relative to the input amount
      const calculatedSlippage = calculateSlippageFromDollarValues(gasCostUSDValue, inputDollarValue)

      // For input-based calculation, we might want to be more conservative
      return applySlippageLimits(
        calculatedSlippage,
        Number(MIN_AUTO_SLIPPAGE_TOLERANCE.numerator),
        Number(MAX_AUTO_SLIPPAGE_TOLERANCE.numerator),
      )
    }

    // Default fallback
    return DEFAULT_AUTO_SLIPPAGE
  }, [inputAmount, onL2, inputDollarValue, gasCostUSDValue])
}
