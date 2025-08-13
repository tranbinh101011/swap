import { useAccount } from 'wagmi'
import { useMockWalletContext } from 'contexts/MockWalletContext'
import { useMemo } from 'react'

interface UseActiveWalletReturn {
  address: string | undefined
  isConnected: boolean
  wallet: any | null
  source: 'mock' | 'wagmi' | 'none'
}

export const useActiveWallet = (): UseActiveWalletReturn => {
  const { address: wagmiAddress, isConnected: wagmiConnected } = useAccount()
  const { mockWallet } = useMockWalletContext()

  const result = useMemo(() => {
    console.log('🔍 [useActiveWallet] Evaluating active wallet:', {
      mockWalletConnected: mockWallet.isConnected,
      mockWalletAddress: mockWallet.address,
      wagmiConnected,
      wagmiAddress
    })

    // Ưu tiên wagmi wallet (wallet thực tế) trước
    if (wagmiConnected && wagmiAddress) {
      console.log('✅ [useActiveWallet] Using wagmi wallet (real wallet)')
      return {
        address: wagmiAddress,
        isConnected: true,
        wallet: null, // wagmi doesn't expose wallet instance
        source: 'wagmi' as const
      }
    }

    // Fallback to mock wallet nếu không có wagmi wallet
    if (mockWallet.isConnected && mockWallet.address) {
      console.log('✅ [useActiveWallet] Using mock wallet as fallback')
      return {
        address: mockWallet.address,
        isConnected: true,
        wallet: mockWallet.wallet,
        source: 'mock' as const
      }
    }

    console.log('❌ [useActiveWallet] No wallet connected')
    return {
      address: undefined,
      isConnected: false,
      wallet: null,
      source: 'none' as const
    }
  }, [
    mockWallet.isConnected,
    mockWallet.address,
    mockWallet.wallet,
    wagmiConnected,
    wagmiAddress
  ])

  return result
}
