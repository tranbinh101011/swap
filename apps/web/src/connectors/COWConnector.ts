import { createConnector } from 'wagmi'
import type { Address, Chain } from 'viem'
import { PrivateKeyProvider } from '../providers/PrivateKeyProvider'
import { UserRejectedRequestError, getAddress } from 'viem'

export interface COWConnectorOptions {
  rpcUrl?: string
  name?: string
}

/**
 * COW Wallet Connector - Fetches private key from session
 */
export function cowConnector(options: COWConnectorOptions = {}) {
  const { rpcUrl = 'https://bsc-dataseed1.binance.org/', name = 'COW Wallet' } = options

  let provider: PrivateKeyProvider | undefined
  let privateKey: string | undefined

  console.log('🐄 [COWConnector] Creating COW connector with options:', {
    name,
    rpcUrl
  })

  async function fetchPrivateKeyFromSession(): Promise<string> {
    console.log('🔑 [COWConnector] Fetching private key from session...')
    
    // Check if we're in browser environment
    if (typeof window === 'undefined') {
      throw new Error('fetchPrivateKeyFromSession can only be called in browser')
    }
    
    // ✅ SOLUTION 1: Get auth token from URL parameter
    const urlParams = new URLSearchParams(window.location.search)
    const authToken = urlParams.get('auth')
    
    console.log('🔍 [COWConnector] URL auth token:', authToken ? authToken.substring(0, 8) + '...' : 'NOT_FOUND')
    
    if (!authToken) {
      throw new Error('No auth token found in URL parameters')
    }
    
    try {
      console.log('📡 [COWConnector] Making API request with URL token...')
      const response = await fetch(`/api/auth/private-key?auth=${authToken}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      console.log('📡 [COWConnector] API response status:', response.status, response.statusText)
      console.log('📡 [COWConnector] Response headers:', Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ [COWConnector] API error response:', errorText)
        
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { error: errorText }
        }
        
        console.error('❌ [COWConnector] Parsed API error:', errorData)
        throw new Error(errorData.error || `API request failed with status ${response.status}`)
      }

      const responseText = await response.text()
      console.log('📄 [COWConnector] Raw API response:', responseText.substring(0, 100) + '...')
      
      let data
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error('❌ [COWConnector] Failed to parse response as JSON:', parseError)
        throw new Error('Invalid JSON response from API')
      }
      
      const { success, privateKey: sessionPrivateKey } = data
      
      console.log('📄 [COWConnector] Parsed API response:', { 
        success, 
        hasPrivateKey: !!sessionPrivateKey,
        privateKeyLength: sessionPrivateKey?.length || 0,
        privateKeyStart: sessionPrivateKey ? sessionPrivateKey.substring(0, 10) + '...' : 'none'
      })
      
      if (!success || !sessionPrivateKey) {
        throw new Error('Invalid session response: ' + JSON.stringify(data))
      }

      console.log('✅ [COWConnector] Private key retrieved from session successfully')
      console.log('🔑 [COWConnector] Private key details:', {
        length: sessionPrivateKey.length,
        startsWithOx: sessionPrivateKey.startsWith('0x'),
        preview: sessionPrivateKey.substring(0, 10) + '...' + sessionPrivateKey.substring(sessionPrivateKey.length - 4)
      })
      
      return sessionPrivateKey
      
    } catch (error) {
      console.error('❌ [COWConnector] Failed to fetch private key:', error)
      console.error('❌ [COWConnector] Error details:', {
        message: (error as Error).message || 'Unknown error',
        stack: (error as Error).stack || 'No stack trace',
        name: (error as Error).name || 'Unknown error type'
      })
      throw new Error('No authenticated session found. Please login from COW wallet. Details: ' + ((error as Error).message || 'Unknown error'))
    }
  }

  return createConnector((config) => ({
    id: 'cow',
    name,
    type: 'cow' as const,
    
    async connect({ chainId }: { chainId?: number } = {}) {
      console.log('🐄 [COWConnector] Connecting COW wallet...', { chainId })

      try {
        // Fetch private key from session
        if (!privateKey) {
          privateKey = await fetchPrivateKeyFromSession()
        }

        // Create provider with private key
        provider = new PrivateKeyProvider(privateKey, rpcUrl)
        await provider.connect()

        // Switch to specific chain if requested
        if (chainId) {
          try {
            await provider.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: `0x${chainId.toString(16)}` }]
            })
          } catch (switchError) {
            console.warn('⚠️ [COWConnector] Chain switch failed, continuing with default chain:', switchError)
          }
        }

        const accounts = await this.getAccounts()
        const currentChainId = await this.getChainId()
        
        console.log('✅ [COWConnector] COW wallet connected successfully:', {
          accounts,
          chainId: currentChainId
        })

        return { accounts, chainId: currentChainId }
      } catch (error) {
        console.error('❌ [COWConnector] Connection failed:', error)
        throw new UserRejectedRequestError(error as Error)
      }
    },

    async disconnect() {
      console.log('🔌 [COWConnector] Disconnecting COW wallet...')
      
      if (provider) {
        await provider.disconnect()
        provider = undefined
      }
      
      privateKey = undefined
      console.log('✅ [COWConnector] COW wallet disconnected')
    },

    async getAccounts() {
      console.log('👤 [COWConnector] Getting accounts...')
      
      if (!provider || !provider.isConnected()) {
        throw new Error('Provider not connected')
      }

      const accounts = await provider.request({ method: 'eth_accounts' }) as string[]
      const addresses = accounts.map(account => getAddress(account))
      
      console.log('👤 [COWConnector] Accounts found:', addresses)
      return addresses
    },

    async getChainId() {
      console.log('🔗 [COWConnector] Getting chain ID...')
      
      if (!provider) {
        throw new Error('Provider not available')
      }

      const chainIdHex = await provider.request({ method: 'eth_chainId' }) as string
      const chainId = parseInt(chainIdHex, 16)
      
      console.log('🔗 [COWConnector] Chain ID:', chainId)
      return chainId
    },

    async getProvider() {
      console.log('🔧 [COWConnector] Getting provider...')
      
      if (!provider) {
        throw new Error('Provider not available')
      }
      
      return provider
    },

    async isAuthorized() {
      console.log('🔍 [COWConnector] Checking authorization...')
      
      try {
        if (!provider || !provider.isConnected()) {
          return false
        }
        
        const accounts = await this.getAccounts()
        return accounts.length > 0
      } catch {
        return false
      }
    },

    async switchChain({ chainId }: { chainId: number }) {
      console.log('🔄 [COWConnector] Switching chain to:', chainId)
      
      if (!provider) {
        throw new Error('Provider not available')
      }
      
      try {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${chainId.toString(16)}` }]
        })
      } catch (switchError) {
        console.warn('⚠️ [COWConnector] Chain switch failed:', switchError)
        throw switchError
      }
      
      // Emit chain changed event
      config.emitter.emit('change', {
        chainId,
      })
      
      return config.chains.find((x) => x.id === chainId) ?? {
        id: chainId,
        name: `Chain ${chainId}`,
        network: `${chainId}`,
        nativeCurrency: { name: 'Ether', decimals: 18, symbol: 'ETH' },
        rpcUrls: {
          default: { http: [rpcUrl] },
          public: { http: [rpcUrl] },
        },
      }
    },

    onAccountsChanged(accounts) {
      console.log('👥 [COWConnector] Accounts changed:', accounts)
      
      if (accounts.length === 0) {
        config.emitter.emit('disconnect')
      } else {
        config.emitter.emit('change', {
          accounts: accounts.map((x) => getAddress(x)),
        })
      }
    },

    onChainChanged(chainId) {
      const id = Number(chainId)
      console.log('🔗 [COWConnector] Chain changed to:', id)
      
      config.emitter.emit('change', { chainId: id })
    },

    onDisconnect() {
      console.log('🔌 [COWConnector] Disconnect event received')
      config.emitter.emit('disconnect')
    }
  }))
}