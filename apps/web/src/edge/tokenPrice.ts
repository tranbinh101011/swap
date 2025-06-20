import { ChainId } from '@pancakeswap/chains'
import { chainlinkOracleCAKE } from '@pancakeswap/prediction'
import { CurrencyParams, getCurrencyUsdPrice } from '@pancakeswap/price-api-sdk'
import { Native } from '@pancakeswap/sdk'
import { OnChainProvider, PoolType, SmartRouter, SmartRouterTrade } from '@pancakeswap/smart-router'
import { Currency, CurrencyAmount, getCurrencyAddress, TradeType } from '@pancakeswap/swap-sdk-core'
import { CAKE, STABLE_COIN } from '@pancakeswap/tokens'
import { chainlinkOracleABI } from 'config/abi/chainlinkOracle'
import { getMulticallGasLimit } from 'quoter/hook/useMulticallGasLimit'
import { edgeQueries } from 'quoter/utils/edgePoolQueries'
import { mockCurrency } from 'quoter/utils/edgeQueries.util'
import { computeTradePriceBreakdown, warningSeverity } from 'utils/compuateTradePriceBreakdown'
import { getViemClients } from 'utils/viem.server'
import { Address } from 'viem/accounts'
import { formatUnits } from 'viem/utils'

function parseQueryParams(params: {
  chainId: ChainId
  address?: Address
  isNative?: boolean
}): CurrencyParams | undefined {
  const { chainId, address, isNative } = params
  if (isNative) {
    return { chainId, isNative: true }
  }
  if (address) {
    return { chainId, address }
  }
  return undefined
}

export async function queryTokenPrice(params: {
  chainId: ChainId
  address?: Address
  isNative?: boolean
  hideIfPriceImpactTooHigh?: boolean
}) {
  const { chainId, address, isNative, hideIfPriceImpactTooHigh } = params
  const currencyParams = parseQueryParams(params)

  if (!isNative && !address) {
    throw new Error('address is required for non-native tokens')
  }

  if (!currencyParams) {
    throw new Error('invalid params')
  }

  const stableCoin = STABLE_COIN[chainId]
  if (!stableCoin) {
    throw new Error('unsupported chain')
  }

  const cake = CAKE[chainId]
  if (!isNative && address && cake && cake.address.toLowerCase() === address.toLowerCase()) {
    const price = await getCakePriceFromOracle()
    return {
      price: Number(price),
      from: 'oracle',
    }
  }

  if (!isNative && address && stableCoin.address.toLowerCase() === address.toLowerCase()) {
    return {
      price: 1,
      from: 'calc',
    }
  }
  if (isNative && stableCoin.isNative) {
    return {
      price: 1,
      from: 'calc',
    }
  }

  const priceFromApi = await getCurrencyUsdPriceFromApi(currencyParams)

  if (priceFromApi) {
    return {
      price: priceFromApi,
      from: 'api',
    }
  }

  try {
    const token: Currency = isNative ? Native.onChain(chainId) : await mockCurrency(address!, chainId)

    const amountOut = CurrencyAmount.fromRawAmount(stableCoin, 5n * 10n ** BigInt(stableCoin.decimals))

    const client = getViemClients({ chainId })
    const [blockNumber, gasPrice] = await Promise.all([client.getBlockNumber(), client.getGasPrice()])

    const gasLimit = await getMulticallGasLimit(getViemClients as OnChainProvider, chainId)
    const candidatePools = await edgeQueries.fetchAllCandidatePools(
      stableCoin.address,
      getCurrencyAddress(token),
      chainId,
      ['v2', 'v3'],
    )
    const pools = candidatePools.map((pool) => {
      return SmartRouter.Transformer.parsePool(chainId, pool)
    })

    const quoteProvider = SmartRouter.createQuoteProvider({
      onChainProvider: getViemClients as OnChainProvider,
      gasLimit: gasLimit * 1000n,
    })

    const trade = await SmartRouter.getBestTrade(amountOut, token, TradeType.EXACT_OUTPUT, {
      gasPriceWei: gasPrice,
      poolProvider: SmartRouter.createStaticPoolProvider(pools),
      quoteProvider,
      maxHops: 3,
      maxSplits: 0,
      blockNumber: Number(blockNumber),
      allowedPoolTypes: [PoolType.V2, PoolType.V3],
      quoterOptimization: false,
    })
    if (!trade) {
      return undefined
    }

    // if price impact is too high, don't show price
    if (hideIfPriceImpactTooHigh) {
      // @ts-ignore
      const { priceImpactWithoutFee } = computeTradePriceBreakdown(trade as unknown as SmartRouterTrade<TradeType>)

      if (!priceImpactWithoutFee || warningSeverity(priceImpactWithoutFee) > 2) {
        return undefined
      }
    }

    const input = Number(trade.inputAmount.toExact())
    const output = Number(trade.outputAmount.toExact())

    return {
      price: output / input,
      from: 'quote',
    }
  } catch (ex) {
    console.error(ex)
    return undefined
  }
}

const getCakePriceFromOracle = async () => {
  try {
    const client = getViemClients({ chainId: ChainId.BSC })
    const data = await client.readContract({
      abi: chainlinkOracleABI,
      address: chainlinkOracleCAKE[ChainId.BSC],
      functionName: 'latestAnswer',
    })

    return formatUnits(data, 8)
  } catch {
    console.warn('Failed to fetch CAKE price from oracle')
    return undefined
  }
}

const getCurrencyUsdPriceFromApi = async (params: CurrencyParams) => {
  try {
    return await getCurrencyUsdPrice(params)
  } catch {
    console.warn('Failed to fetch currency price from API')
    return undefined
  }
}
