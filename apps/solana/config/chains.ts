export type BlockExplorer = { name: string; url: string; params?: Record<string, string> }

export type Chain = {
  /** ID in number form */
  id: number
  /** Human-readable name */
  name: string
  /** Internal network name */
  network: string
  /** Collection of Node url endpoints */
  nodeUrls: {
    [key: string]: string
    default: string
  }
  /** Collection of block explorers */
  blockExplorers?: {
    [key: string]: BlockExplorer
    default: BlockExplorer
  }
  /** Flag for test networks */
  testnet?: boolean
} & (MainnetChain | TestnetChain)

type MainnetChain = {
  testnet?: false
}

type TestnetChain = {
  testnet: true
  faucetUrl: string
}

export const mainnet: Chain = {
  id: 101,
  name: 'Mainnet',
  network: 'mainnet',
  nodeUrls: {
    default: 'https://api.mainnet-beta.solana.com',
    nodeReal: 'https://api.mainnet-beta.solana.com',
  },
  blockExplorers: {
    default: {
      name: 'solana Explorer',
      url: 'http://explorer.solana.com/',
      params: {
        network: 'mainnet',
      },
    },
  },
}

export const APTOS_MENU = {
  id: 1,
  name: 'Aptos',
  link: 'https://aptos.pancakeswap.finance/swap',
  image: 'https://aptos.pancakeswap.finance/images/apt.png',
}

export const chains = [mainnet]

export const defaultChain = mainnet
