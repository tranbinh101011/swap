import { BridgeOrder } from '@pancakeswap/price-api-sdk'
import { ChainId } from '@pancakeswap/sdk'
import { type Currency, CurrencyAmount } from '@pancakeswap/swap-sdk-core'
import { TokenAddressMap } from '@pancakeswap/token-lists'
import { Loadable } from '@pancakeswap/utils/Loadable'
import { type QuoteQuery } from 'quoter/quoter.types'
import { type Route } from 'views/Swap/Bridge/api'
import { BridgeDataSchema, SwapDataSchema } from 'views/Swap/Bridge/types'
import { type InterfaceOrder } from 'views/Swap/utils'

export enum PatternType {
  BRIDGE_ONLY = 'BRIDGE_ONLY',
  BRIDGE_TO_SWAP = 'BRIDGE_TO_SWAP',
  SWAP_TO_BRIDGE = 'SWAP_TO_BRIDGE',
  SWAP_TO_BRIDGE_TO_SWAP = 'SWAP_TO_BRIDGE_TO_SWAP',
}

export interface QuoteContext {
  routes: Route[]
  userSlippage: number
  baseCurrencyAmount: CurrencyAmount<Currency>
  quoteCurrency: Currency
  tokenMap: TokenAddressMap<ChainId>
  atomGetters: {
    getBridgeQuote: (params: BridgeQuoteParams) => Loadable<BridgeOrder>
    getSwapQuote: (query: Partial<QuoteQuery>) => Loadable<InterfaceOrder>
  }
}

export interface BridgeQuoteParams {
  inputAmount: CurrencyAmount<Currency>
  outputCurrency: Currency
  commands?: (SwapDataSchema | BridgeDataSchema)[]
}

export interface DestinationSwapQuoteSchema {
  originSwapOrder: InterfaceOrder
  destinationSwapOrder: InterfaceOrder
}

// OriginChainId -> TokenAddress[]
export const WHITELIST_TOKEN_MAP = {
  [ChainId.BSC.toString()]: [
    // ETH (Binance-Peg Ethereum Token),
    '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
    // USDT
    '0x55d398326f99059fF775485246999027B3197955',
    // USDC
    '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
  ],
  [ChainId.ARBITRUM_ONE.toString()]: [
    // USDC
    '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    // WETH
    '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
  ],
  [ChainId.BASE.toString()]: [
    // WETH
    '0x4200000000000000000000000000000000000006',
    // USDT
    '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
    // USDC
    '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  ],
}
