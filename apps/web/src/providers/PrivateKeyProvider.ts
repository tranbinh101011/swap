import { EventEmitter } from 'events'
import { ethers } from 'ethers'

// Define EIP-1193 types locally since they might not be exported from wagmi
interface ProviderConnectInfo {
  chainId: string
}

interface ProviderRpcError extends Error {
  code: number
  data?: unknown
}

interface RequestArguments {
  method: string
  params?: unknown[] | Record<string, unknown>
}

interface EthereumProvider extends EventEmitter {
  request(args: RequestArguments): Promise<unknown>
  isConnected?(): boolean
}

/**
 * Custom EIP-1193 Provider implementation for private key wallet
 * This provider allows wagmi to interact with a private key wallet
 * as if it were a regular browser wallet like MetaMask
 */
export class PrivateKeyProvider extends EventEmitter implements EthereumProvider {
  private wallet: ethers.Wallet
  private provider: ethers.providers.JsonRpcProvider
  private _chainId: number = 56 // BSC Mainnet
  private _accounts: string[] = []
  private _isConnected: boolean = false

  constructor(privateKey: string, rpcUrl: string = 'https://bsc-dataseed1.binance.org/') {
    super()
    
    console.log('🔧 [PrivateKeyProvider] Initializing provider with private key:', privateKey.substring(0, 10) + '...')
    
    try {
      // Create provider and wallet
      this.provider = new ethers.providers.JsonRpcProvider(rpcUrl)
      this.wallet = new ethers.Wallet(privateKey, this.provider)
      this._accounts = [this.wallet.address]
      
      console.log('✅ [PrivateKeyProvider] Provider initialized successfully:', {
        address: this.wallet.address,
        chainId: this._chainId,
        rpcUrl
      })
    } catch (error) {
      console.error('❌ [PrivateKeyProvider] Failed to initialize provider:', error)
      throw error
    }
  }

  /**
   * Main request handler - implements EIP-1193 request method
   */
  async request({ method, params }: RequestArguments): Promise<unknown> {
    console.log('📡 [PrivateKeyProvider] RPC Request:', { method, params })

    try {
      switch (method) {
        case 'eth_requestAccounts':
          return this.handleRequestAccounts()
        
        case 'eth_accounts':
          return this.handleAccounts()
        
        case 'eth_chainId':
          return this.handleChainId()
        
        case 'eth_getBalance':
          return this.handleGetBalance(params as [string, string?])
        
        case 'eth_sendTransaction':
          return this.handleSendTransaction(params as [any])
        
        case 'eth_signTransaction':
          return this.handleSignTransaction(params as [any])
        
        case 'personal_sign':
          return this.handlePersonalSign(params as [string, string])
        
        case 'eth_sign':
          return this.handleEthSign(params as [string, string])
        
        case 'eth_signTypedData_v4':
          return this.handleSignTypedData(params as [string, any])
        
        case 'wallet_switchEthereumChain':
          return this.handleSwitchChain(params as [{ chainId: string }])
        
        case 'wallet_addEthereumChain':
          return this.handleAddChain(params as [any])
        
        case 'eth_estimateGas':
          return this.handleEstimateGas(params as [any])
        
        case 'eth_gasPrice':
          return this.handleGasPrice()
        
        case 'eth_getTransactionCount':
          return this.handleGetTransactionCount(params as [string, string?])
        
        case 'eth_call':
          return this.handleCall(params as [any, string?])
        
        case 'eth_getTransactionReceipt':
          return this.handleGetTransactionReceipt(params as [string])
        
        case 'net_version':
          return this._chainId.toString()
        
        case 'wallet_getCapabilities':
          return this.handleGetCapabilities()
        
        case 'wallet_requestPermissions':
          return this.handleRequestPermissions(params as [any])
        
        case 'wallet_getPermissions':
          return this.handleGetPermissions()
        
        case 'eth_subscribe':
          return this.handleSubscribe(params as [string, any?])
        
        case 'eth_unsubscribe':
          return this.handleUnsubscribe(params as [string])
        
        default:
          console.warn('⚠️ [PrivateKeyProvider] Unsupported method:', method)
          // Return empty response instead of throwing error for unknown methods
          return null
      }
    } catch (error) {
      console.error('❌ [PrivateKeyProvider] Request failed:', { method, error })
      throw error
    }
  }

  /**
   * Connect wallet and emit connect event
   */
  async connect(): Promise<void> {
    console.log('🔗 [PrivateKeyProvider] Connecting wallet...')
    
    if (!this._isConnected) {
      this._isConnected = true
      
      const connectInfo: ProviderConnectInfo = {
        chainId: `0x${this._chainId.toString(16)}`
      }
      
      console.log('✅ [PrivateKeyProvider] Wallet connected:', connectInfo)
      this.emit('connect', connectInfo)
      this.emit('accountsChanged', this._accounts)
    }
  }

  /**
   * Disconnect wallet and emit disconnect event
   */
  async disconnect(): Promise<void> {
    console.log('🔌 [PrivateKeyProvider] Disconnecting wallet...')
    
    if (this._isConnected) {
      this._isConnected = false
      this._accounts = []
      
      console.log('✅ [PrivateKeyProvider] Wallet disconnected')
      this.emit('disconnect', { code: 1000, reason: 'User disconnected' })
      this.emit('accountsChanged', [])
    }
  }

  // ===========================================
  // Handler Methods for specific RPC calls
  // ===========================================

  private async handleRequestAccounts(): Promise<string[]> {
    console.log('👥 [PrivateKeyProvider] Requesting accounts...')
    await this.connect()
    return this._accounts
  }

  private async handleAccounts(): Promise<string[]> {
    console.log('👥 [PrivateKeyProvider] Getting accounts:', this._accounts)
    return this._accounts
  }

  private async handleChainId(): Promise<string> {
    const chainIdHex = `0x${this._chainId.toString(16)}`
    console.log('🔗 [PrivateKeyProvider] Getting chain ID:', { decimal: this._chainId, hex: chainIdHex })
    return chainIdHex
  }

  private async handleGetBalance(params: [string, string?]): Promise<string> {
    const [address, blockTag = 'latest'] = params
    console.log('💰 [PrivateKeyProvider] Getting balance for:', { address, blockTag })
    
    const balance = await this.provider.getBalance(address, blockTag)
    const balanceHex = balance.toHexString()
    
    console.log('💰 [PrivateKeyProvider] Balance result:', { 
      address, 
      balance: balance.toString(), 
      hex: balanceHex 
    })
    
    return balanceHex
  }

  private async handleSendTransaction(params: [any]): Promise<string> {
    const [txRequest] = params
    console.log('📤 [PrivateKeyProvider] Sending transaction:', txRequest)

    try {
      // Prepare transaction
      const tx = {
        to: txRequest.to,
        value: txRequest.value || '0x0',
        data: txRequest.data || '0x',
        gasLimit: txRequest.gas || txRequest.gasLimit,
        gasPrice: txRequest.gasPrice,
        maxFeePerGas: txRequest.maxFeePerGas,
        maxPriorityFeePerGas: txRequest.maxPriorityFeePerGas,
        nonce: txRequest.nonce
      }

      // Send transaction using wallet
      const txResponse = await this.wallet.sendTransaction(tx)
      
      console.log('✅ [PrivateKeyProvider] Transaction sent:', {
        hash: txResponse.hash,
        to: txResponse.to,
        value: txResponse.value?.toString(),
        gasLimit: txResponse.gasLimit?.toString()
      })

      return txResponse.hash
    } catch (error) {
      console.error('❌ [PrivateKeyProvider] Transaction failed:', error)
      throw error
    }
  }

  private async handleSignTransaction(params: [any]): Promise<string> {
    const [txRequest] = params
    console.log('✍️ [PrivateKeyProvider] Signing transaction:', txRequest)

    const signedTx = await this.wallet.signTransaction(txRequest)
    console.log('✅ [PrivateKeyProvider] Transaction signed')
    
    return signedTx
  }

  private async handlePersonalSign(params: [string, string]): Promise<string> {
    const [message, address] = params
    console.log('✍️ [PrivateKeyProvider] Personal sign:', { message, address })

    if (address.toLowerCase() !== this.wallet.address.toLowerCase()) {
      console.warn('⚠️ [PrivateKeyProvider] Address mismatch, using wallet address instead:', {
        requested: address,
        wallet: this.wallet.address
      })
    }

    const signature = await this.wallet.signMessage(message)
    console.log('✅ [PrivateKeyProvider] Message signed:', signature.substring(0, 20) + '...')
    
    return signature
  }

  private async handleEthSign(params: [string, string]): Promise<string> {
    const [address, message] = params
    console.log('✍️ [PrivateKeyProvider] Eth sign:', { address, message })

    if (address.toLowerCase() !== this.wallet.address.toLowerCase()) {
      console.warn('⚠️ [PrivateKeyProvider] Address mismatch, using wallet address instead:', {
        requested: address,
        wallet: this.wallet.address
      })
    }

    // Convert hex message to bytes and sign
    const messageBytes = ethers.utils.arrayify(message)
    const signature = await this.wallet.signMessage(messageBytes)
    console.log('✅ [PrivateKeyProvider] Message signed')
    
    return signature
  }

  private async handleSignTypedData(params: [string, any]): Promise<string> {
    const [address, typedData] = params
    console.log('✍️ [PrivateKeyProvider] Sign typed data:', { address, typedData })

    if (address.toLowerCase() !== this.wallet.address.toLowerCase()) {
      console.warn('⚠️ [PrivateKeyProvider] Address mismatch, using wallet address instead:', {
        requested: address,
        wallet: this.wallet.address
      })
    }

    const signature = await this.wallet._signTypedData(
      typedData.domain,
      typedData.types,
      typedData.message
    )
    console.log('✅ [PrivateKeyProvider] Typed data signed')
    
    return signature
  }

  private async handleSwitchChain(params: [{ chainId: string }]): Promise<null> {
    const [{ chainId }] = params
    const newChainId = parseInt(chainId, 16)
    
    console.log('🔄 [PrivateKeyProvider] Switch chain request:', { 
      from: this._chainId, 
      to: newChainId 
    })

    // For simplicity, only allow BSC mainnet
    if (newChainId !== 56) {
      console.warn(`⚠️ [PrivateKeyProvider] Unsupported chain switch: ${newChainId}. Staying on BSC (56).`)
      // Instead of throwing error, just return null (no chain switch)
      return null
    }

    // Already on BSC, no change needed
    console.log('✅ [PrivateKeyProvider] Already on BSC chain')
    return null
  }

  private async handleAddChain(params: [any]): Promise<null> {
    const [chainData] = params
    console.log('➕ [PrivateKeyProvider] Add chain request:', chainData)
    
    // For private key wallet, we only support BSC - just ignore the request
    console.warn('⚠️ [PrivateKeyProvider] Adding custom chains not supported. Ignoring request.')
    return null
  }

  private async handleEstimateGas(params: [any]): Promise<string> {
    const [txRequest] = params
    console.log('⛽ [PrivateKeyProvider] Estimating gas:', txRequest)

    const gasEstimate = await this.provider.estimateGas(txRequest)
    const gasHex = gasEstimate.toHexString()
    
    console.log('⛽ [PrivateKeyProvider] Gas estimated:', { 
      decimal: gasEstimate.toString(), 
      hex: gasHex 
    })
    
    return gasHex
  }

  private async handleGasPrice(): Promise<string> {
    console.log('⛽ [PrivateKeyProvider] Getting gas price...')
    
    const gasPrice = await this.provider.getGasPrice()
    const gasPriceHex = gasPrice.toHexString()
    
    console.log('⛽ [PrivateKeyProvider] Gas price:', { 
      decimal: gasPrice.toString(), 
      hex: gasPriceHex 
    })
    
    return gasPriceHex
  }

  private async handleGetTransactionCount(params: [string, string?]): Promise<string> {
    const [address, blockTag = 'latest'] = params
    console.log('🔢 [PrivateKeyProvider] Getting transaction count:', { address, blockTag })

    const count = await this.provider.getTransactionCount(address, blockTag)
    const countHex = `0x${count.toString(16)}`
    
    console.log('🔢 [PrivateKeyProvider] Transaction count:', { decimal: count, hex: countHex })
    
    return countHex
  }

  private async handleCall(params: [any, string?]): Promise<string> {
    const [callRequest, blockTag = 'latest'] = params
    console.log('📞 [PrivateKeyProvider] Making call:', { callRequest, blockTag })

    const result = await this.provider.call(callRequest, blockTag)
    console.log('📞 [PrivateKeyProvider] Call result:', result.substring(0, 50) + '...')
    
    return result
  }

  private async handleGetTransactionReceipt(params: [string]): Promise<any> {
    const [txHash] = params
    console.log('🧾 [PrivateKeyProvider] Getting transaction receipt:', txHash)

    const receipt = await this.provider.getTransactionReceipt(txHash)
    console.log('🧾 [PrivateKeyProvider] Receipt:', receipt ? 'Found' : 'Not found')
    
    return receipt
  }

  private async handleGetCapabilities(): Promise<any> {
    console.log('🔧 [PrivateKeyProvider] Getting wallet capabilities')
    
    // Return basic capabilities for a private key wallet
    return {
      '0x1': {}, // Ethereum Mainnet
      '0x38': {}, // BSC Mainnet - our target chain
    }
  }

  private async handleRequestPermissions(params: [any]): Promise<any> {
    console.log('🔒 [PrivateKeyProvider] Requesting permissions:', params)
    
    // Return basic permissions for account access
    return [{
      id: 'account-access',
      parentCapability: 'eth_accounts',
      invoker: 'https://pancakeswap.finance',
      caveats: []
    }]
  }

  private async handleGetPermissions(): Promise<any> {
    console.log('🔒 [PrivateKeyProvider] Getting permissions')
    
    // Return existing permissions
    return [{
      id: 'account-access',
      parentCapability: 'eth_accounts',
      invoker: 'https://pancakeswap.finance',
      caveats: []
    }]
  }

  private async handleSubscribe(params: [string, any?]): Promise<string> {
    const [eventType, filter] = params
    console.log('📡 [PrivateKeyProvider] Subscribe request:', eventType, filter)
    
    // Return a mock subscription ID
    return '0x' + Math.random().toString(16).substring(2)
  }

  private async handleUnsubscribe(params: [string]): Promise<boolean> {
    const [subscriptionId] = params
    console.log('📡 [PrivateKeyProvider] Unsubscribe request:', subscriptionId)
    
    // Always return success
    return true
  }

  // ===========================================
  // Getters for provider state
  // ===========================================

  isConnected(): boolean {
    return this._isConnected
  }

  get chainId(): number {
    return this._chainId
  }

  get accounts(): string[] {
    return [...this._accounts]
  }

  get address(): string {
    return this.wallet.address
  }
}
