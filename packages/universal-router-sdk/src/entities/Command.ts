import { RoutePlanner } from '../utils/routerCommands'

export interface UniversalRouterOptions {
  /**
   * Whether the payer of the trade is the user. Defaults to true.
   * NOTE: This option is ignored in WETH case. Because WETH is now owned by the router, the router pays for inputs.
   */
  payerIsUser?: boolean
}

export interface TradeConfig extends UniversalRouterOptions {
  allowRevert: boolean
}

export enum RouterTradeType {
  PancakeSwapTrade = 'PancakeSwapTrade',
  // NFTTrade = 'NFTTrade',
  UnwrapWETH = 'UnwrapWETH',
}

// interface for entities that can be encoded as a Universal Router command
export interface Command {
  tradeType: RouterTradeType
  encode(planner: RoutePlanner, config: UniversalRouterOptions): void
}
