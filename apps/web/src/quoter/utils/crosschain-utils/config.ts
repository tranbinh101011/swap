import { ChainId } from '@pancakeswap/chains'

// Order will be decided for the Token Selection Modal
export const CROSSCHAIN_SUPPORTED_CHAINS = [ChainId.BSC, ChainId.BASE, ChainId.ARBITRUM_ONE, ChainId.ETHEREUM]

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
  [ChainId.ETHEREUM.toString()]: [
    '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    '0x152649eA73beAb28c5b49B26eb48f7EAD6d4c898',
  ],
}
