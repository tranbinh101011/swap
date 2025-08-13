import { createConnector } from 'wagmi'
import type { 
  Connector
} from 'wagmi'
import type { Address, Chain } from 'viem'
import { PrivateKeyProvider } from '../providers/PrivateKeyProvider'
import { UserRejectedRequestError, getAddress } from 'viem'

export interface PrivateKeyConnectorOptions {
  privateKey: string
  rpcUrl?: string
  name?: string
}

/**
 * Custom Wagmi Connector for Private Key Wallet
 * Uses wagmi v2 createConnector pattern for seamless integration
 */
export function privateKeyConnector(options: PrivateKeyConnectorOptions) {
  const { privateKey, rpcUrl = 'https://bsc-dataseed1.binance.org/', name = 'Private Key Wallet' } = options

  let provider: PrivateKeyProvider | undefined

  console.log('🔧 [PrivateKeyConnector] Creating connector with options:', {
    name,
    privateKey: privateKey.substring(0, 10) + '...',
    rpcUrl
  })

  return createConnector((config) => ({
    id: 'privateKey',
    name,
    type: 'privateKey' as const,
    
    async connect({ chainId }: { chainId?: number } = {}) {
      console.log('🔗 [PrivateKeyConnector] Connecting wallet...', { chainId })

      try {
        if (!provider) {
          provider = new PrivateKeyProvider(privateKey, rpcUrl)
        }

        await provider.connect()

        const accounts = await provider.request({ method: 'eth_accounts' }) as string[]
        const currentChainId = await provider.request({ method: 'eth_chainId' }) as string
        
        const account = getAddress(accounts[0])
        const finalChainId = parseInt(currentChainId, 16)

        console.log('✅ [PrivateKeyConnector] Wallet connected successfully:', {
          account,
          chainId: finalChainId
        })

        // Setup provider event listeners
        provider.on('accountsChanged', (accounts: string[]) => {
          console.log('👥 [PrivateKeyConnector] Accounts changed:', accounts)
          if (accounts.length === 0) {
            config.emitter.emit('disconnect')
          } else {
            config.emitter.emit('change', { accounts: accounts.map(a => getAddress(a)) })
          }
        })

        provider.on('chainChanged', (chainId: string) => {
          console.log('🔗 [PrivateKeyConnector] Chain changed:', chainId)
          config.emitter.emit('change', { chainId: parseInt(chainId, 16) })
        })

        provider.on('disconnect', () => {
          console.log('🔌 [PrivateKeyConnector] Provider disconnected')
          config.emitter.emit('disconnect')
        })

        return {
          accounts: [account],
          chainId: finalChainId
        }
      } catch (error) {
        console.error('❌ [PrivateKeyConnector] Connection failed:', error)
        throw new UserRejectedRequestError(error as Error)
      }
    },

    async disconnect() {
      console.log('🔌 [PrivateKeyConnector] Disconnecting wallet...')
      
      if (provider) {
        await provider.disconnect()
        provider.removeAllListeners()
        provider = undefined
      }
      
      console.log('✅ [PrivateKeyConnector] Wallet disconnected')
    },

    async getAccounts() {
      console.log('👤 [PrivateKeyConnector] Getting accounts...')
      
      if (!provider || !provider.isConnected()) {
        return []
      }

      const accounts = await provider.request({ method: 'eth_accounts' }) as string[]
      const addresses = accounts.map(account => getAddress(account))
      
      console.log('👤 [PrivateKeyConnector] Accounts found:', addresses)
      return addresses
    },

    async getChainId() {
      console.log('🔗 [PrivateKeyConnector] Getting chain ID...')
      
      if (!provider) {
        return 56 // Default to BSC
      }

      const chainIdHex = await provider.request({ method: 'eth_chainId' }) as string
      const chainId = parseInt(chainIdHex, 16)
      
      console.log('🔗 [PrivateKeyConnector] Chain ID:', { hex: chainIdHex, decimal: chainId })
      return chainId
    },

    async getProvider() {
      console.log('📡 [PrivateKeyConnector] Getting provider...')
      
      if (!provider) {
        provider = new PrivateKeyProvider(privateKey, rpcUrl)
      }

      return provider
    },

    async isAuthorized() {
      console.log('🔐 [PrivateKeyConnector] Checking authorization...')
      
      try {
        if (!provider) {
          provider = new PrivateKeyProvider(privateKey, rpcUrl)
        }

        // Auto-connect if not connected
        if (!provider.isConnected()) {
          console.log('🔐 [PrivateKeyConnector] Provider not connected, auto-connecting...')
          await provider.connect()
        }

        const accounts = await provider.request({ method: 'eth_accounts' }) as string[]
        const isAuthorized = accounts && accounts.length > 0
        
        console.log('🔐 [PrivateKeyConnector] Authorization status:', { 
          isAuthorized, 
          accountsCount: accounts?.length || 0,
          isConnected: provider.isConnected()
        })
        
        return isAuthorized
      } catch (error) {
        console.error('❌ [PrivateKeyConnector] Authorization check failed:', error)
        return false
      }
    },

    async switchChain({ chainId }: { chainId: number }) {
      console.log('🔄 [PrivateKeyConnector] Switching chain:', chainId)
      
      if (!provider) {
        throw new Error('Provider not initialized')
      }

      try {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${chainId.toString(16)}` }]
        })

        console.log('✅ [PrivateKeyConnector] Chain switched successfully to:', chainId)
        
        // Return a proper Chain object for BSC
        return {
          id: chainId,
          name: chainId === 56 ? 'BSC' : `Chain ${chainId}`,
          nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
          rpcUrls: { default: { http: [rpcUrl] } }
        }
      } catch (error) {
        console.error('❌ [PrivateKeyConnector] Chain switch failed:', error)
        throw error
      }
    },

    onAccountsChanged(accounts) {
      console.log('� [PrivateKeyConnector] Accounts changed event:', accounts)
      if (accounts.length === 0) {
        this.disconnect()
      }
    },

    onChainChanged(chainId) {
      console.log('🔗 [PrivateKeyConnector] Chain changed event:', chainId)
    },

    onDisconnect() {
      console.log('🔌 [PrivateKeyConnector] Disconnect event')
    }
  }))
}
