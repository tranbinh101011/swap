import { getWagmiConnectorV2 } from '@binance/w3w-wagmi-connector-v2'
import { cyberWalletConnector as createCyberWalletConnector, isCyberWallet } from '@cyberlab/cyber-app-sdk'
import { blocto } from '@pancakeswap/wagmi/connectors/blocto'
import { CHAINS } from 'config/chains'
import { PUBLIC_NODES } from 'config/nodes'
import { ConnectorNames } from 'config/wallet'
import memoize from 'lodash/memoize'
import { Transport } from 'viem'
import { createConfig, http } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { coinbaseWallet, injected, safe } from 'wagmi/connectors'
// import { walletConnect } from 'wagmi/connectors' // Temporarily disable to fix ES module issues
import { fallbackWithRank } from './fallbackWithRank'
import { CLIENT_CONFIG, publicClient } from './viem'
import { privateKeyConnector as createPrivateKeyConnector } from '../connectors/PrivateKeyConnector'
import { cowConnector as createCowConnector } from '../connectors/COWConnector'

export const chains = CHAINS

export const injectedConnector = injected({
  shimDisconnect: false,
})

export const coinbaseConnector = coinbaseWallet({
  appName: 'PancakeSwap',
  appLogoUrl: 'https://pancakeswap.com/logo.png',
})

/* Temporarily disable WalletConnect to fix ES module issues
export const walletConnectConnector = walletConnect({
  // ignore the error in test environment
  // Error: To use QR modal, please install @walletconnect/modal package
  showQrModal: process.env.NODE_ENV !== 'test',
  projectId: 'e542ff314e26ff34de2d4fba98db70bb',
})

export const walletConnectNoQrCodeConnector = walletConnect({
  showQrModal: false,
  projectId: 'e542ff314e26ff34de2d4fba98db70bb',
})
*/

export const metaMaskConnector = injected({ target: 'metaMask', shimDisconnect: false })
export const trustConnector = injected({ target: 'trust', shimDisconnect: true })

const bloctoConnector = blocto({
  appId: 'e2f2f0cd-3ceb-4dec-b293-bb555f2ed5af',
})

export const binanceWeb3WalletConnector = getWagmiConnectorV2()

export const noopStorage = {
  getItem: (_key: any) => '',
  setItem: (_key: any, _value: any) => {},
  removeItem: (_key: any) => {},
}

const PUBLIC_MAINNET = 'https://ethereum.publicnode.com'

export const transports = chains.reduce((ts, chain) => {
  let httpStrings: string[] | readonly string[] = []

  if (process.env.NODE_ENV === 'test' && chain.id === mainnet.id) {
    httpStrings = [PUBLIC_MAINNET]
  } else {
    httpStrings = PUBLIC_NODES[chain.id] ? PUBLIC_NODES[chain.id] : []
  }

  if (ts) {
    return {
      ...ts,
      [chain.id]: fallbackWithRank(httpStrings.map((t: any) => http(t))),
    }
  }

  return {
    [chain.id]: fallbackWithRank(httpStrings.map((t: any) => http(t))),
  }
}, {} as Record<number, Transport>)

export const cyberWalletConnector = isCyberWallet()
  ? createCyberWalletConnector({
      name: 'PancakeSwap',
      appId: 'b825cd87-2db3-456d-b108-d61e74d89771',
    })
  : undefined

// COW Wallet Connector for session-based private key from COW_N
export const cowWalletConnector = createCowConnector({
  rpcUrl: 'https://bsc-dataseed1.binance.org/',
  name: 'COW Wallet'
})

console.log('� [Wagmi Config] COW Wallet Connector initialized successfully')

export const CONNECTOR_MAP = {
  [ConnectorNames.MetaMask]: metaMaskConnector,
  [ConnectorNames.Injected]: injectedConnector,
  //  [ConnectorNames.Safe]: safe(),
  [ConnectorNames.WalletLink]: coinbaseConnector,
  // [ConnectorNames.WalletConnect]: walletConnectConnector, // Temporarily disable
  [ConnectorNames.Blocto]: bloctoConnector,
  [ConnectorNames.TrustWallet]: trustConnector,
  [ConnectorNames.BinanceW3W]: binanceWeb3WalletConnector(),
  [ConnectorNames.CyberWallet]: cyberWalletConnector,
  'COWWallet': cowWalletConnector, // COW Wallet connector for session-based connection
}

export const CONNECTORS = [
  cowWalletConnector, // COW Wallet connector as first option
  metaMaskConnector,
  injectedConnector,
  safe(),
  coinbaseConnector,
  // walletConnectConnector, // Temporarily disable to test private key connector
  bloctoConnector,
  // ledgerConnector,
  trustConnector,
  binanceWeb3WalletConnector(),
  ...(cyberWalletConnector ? [cyberWalletConnector as any] : []),
]

export function createWagmiConfig() {
  return createConfig({
    chains,
    ssr: true,
    syncConnectedChain: true,
    transports,
    ...CLIENT_CONFIG,
    connectors: [...CONNECTORS],
  })
}

export const createW3WWagmiConfig = () => {
  return createConfig({
    chains,
    ssr: true,
    syncConnectedChain: true,
    transports,
    ...CLIENT_CONFIG,

    connectors: [injectedConnector, binanceWeb3WalletConnector()],
  })
}

export const CHAIN_IDS = chains.map((c) => c.id)

export const isChainSupported = memoize((chainId: number) => (CHAIN_IDS as number[]).includes(chainId))
export const isChainTestnet = memoize((chainId: number) => {
  const found = chains.find((c) => c.id === chainId)
  return found ? 'testnet' in found : false
})

export { publicClient }
