import { ethers } from 'ethers'

interface MockWalletData {
  privateKey: string
  address: string
  publicKey: string
}

class MockWalletService {
  private wallet: ethers.Wallet | null = null
  private provider: ethers.providers.JsonRpcProvider | null = null
  private isConnected: boolean = false

  async connectMockWallet(): Promise<boolean> {
    console.log('🚀 [MockWalletService] Starting mock wallet connection...')
    
    try {
      // Gọi API mock để lấy private key
      console.log('📡 [MockWalletService] Fetching mock wallet data from API...')
      const response = await fetch('/api/mock-wallet')
      const result = await response.json()
      
      if (!result.success) {
        console.error('❌ [MockWalletService] API returned error:', result.error)
        throw new Error(result.error || 'Failed to get mock wallet data')
      }

      const { privateKey, address } = result.data
      console.log('✅ [MockWalletService] Received wallet data for address:', address)
      
      // Tạo provider (BSC mainnet)
      const rpcUrl = 'https://bsc-dataseed.binance.org/'
      console.log('🌐 [MockWalletService] Creating provider with RPC:', rpcUrl)
      this.provider = new ethers.providers.JsonRpcProvider(rpcUrl)
      
      // Tạo wallet từ private key
      console.log('🔑 [MockWalletService] Creating wallet instance...')
      this.wallet = new ethers.Wallet(privateKey, this.provider)
      this.isConnected = true
      
      console.log('🎉 [MockWalletService] Mock wallet connected successfully!')
      console.log('📍 [MockWalletService] Wallet address:', this.wallet.address)
      
      try {
        const network = await this.provider.getNetwork()
        console.log('🔗 [MockWalletService] Connected to network:', network)
      } catch (error) {
        console.warn('⚠️ [MockWalletService] Could not get network info:', error)
      }
      
      return true
    } catch (error) {
      console.error('💥 [MockWalletService] Failed to connect mock wallet:', error)
      this.cleanup()
      return false
    }
  }

  getWallet(): ethers.Wallet | null {
    console.log('🔍 [MockWalletService] Getting wallet instance:', !!this.wallet)
    return this.wallet
  }

  getAddress(): string | null {
    const address = this.wallet?.address || null
    console.log('📍 [MockWalletService] Getting address:', address)
    return address
  }

  async getBalance(): Promise<string> {
    if (!this.wallet || !this.provider) {
      console.log('⚠️ [MockWalletService] No wallet or provider available for balance check')
      return '0'
    }
    
    try {
      console.log('💰 [MockWalletService] Fetching balance for:', this.wallet.address)
      const balance = await this.provider.getBalance(this.wallet.address)
      const balanceEth = ethers.utils.formatEther(balance)
      console.log('💰 [MockWalletService] Balance:', balanceEth, 'BNB')
      return balanceEth
    } catch (error) {
      console.error('💥 [MockWalletService] Failed to get balance:', error)
      return '0'
    }
  }

  async getChainId(): Promise<number> {
    if (!this.provider) {
      console.log('⚠️ [MockWalletService] No provider available for chain ID')
      return 56 // BSC mainnet default
    }
    
    try {
      const network = await this.provider.getNetwork()
      const chainId = Number(network.chainId)
      console.log('⛓️ [MockWalletService] Chain ID:', chainId)
      return chainId
    } catch (error) {
      console.error('💥 [MockWalletService] Failed to get chain ID:', error)
      return 56 // BSC mainnet default
    }
  }

  isWalletConnected(): boolean {
    const connected = this.isConnected && !!this.wallet
    console.log('🔌 [MockWalletService] Wallet connected status:', connected)
    return connected
  }

  disconnect(): void {
    console.log('🔌 [MockWalletService] Disconnecting mock wallet...')
    this.cleanup()
    console.log('✅ [MockWalletService] Mock wallet disconnected')
  }

  private cleanup(): void {
    this.wallet = null
    this.provider = null
    this.isConnected = false
  }

  // Utility method để tạo transaction
  async sendTransaction(transactionRequest: ethers.providers.TransactionRequest): Promise<ethers.providers.TransactionResponse | null> {
    if (!this.wallet) {
      console.error('❌ [MockWalletService] No wallet available for transaction')
      return null
    }

    try {
      console.log('📤 [MockWalletService] Sending transaction:', transactionRequest)
      const tx = await this.wallet.sendTransaction(transactionRequest)
      console.log('✅ [MockWalletService] Transaction sent:', tx.hash)
      return tx
    } catch (error) {
      console.error('💥 [MockWalletService] Transaction failed:', error)
      throw error
    }
  }
}

export const mockWalletService = new MockWalletService()
