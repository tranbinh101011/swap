// import { useEffe    // Auto-connect mock wallet only if no real wallet is connected
//     if (!wagmiConnected && !mockWallet.isConnected) {
//       console.log('🚀 [AutoConnectMockWallet] Attempting to auto-connect mock wallet...')
//       // Try to trigger connect manually if auto-connect failed
//       if (mockWallet.connectWallet) {
//         console.log('🚀 [AutoConnectMockWallet] Manually connecting mock wallet...')
//         mockWallet.connectWallet()
//       }
//     } 'react'
// import { useMockWalletContext } from 'contexts/MockWalletContext'
// import { useAccount } from 'wagmi'

// const AutoConnectMockWallet = () => {
//   const { mockWallet } = useMockWalletContext()
//   const { isConnected: wagmiConnected } = useAccount()

//   useEffect(() => {
//     console.log('🚀 [AutoConnectMockWallet] Current status:', {
//       wagmiConnected,
//       mockWalletConnected: mockWallet.isConnected,
//       mockWalletAddress: mockWallet.address,
//       mockWalletBalance: mockWallet.balance
//     })

//     // Auto-connect mock wallet only if no real wallet is connected
//     if (!wagmiConnected && !mockWallet.isConnected) {
//       console.log('🚀 [AutoConnectMockWallet] Attempting to auto-connect mock wallet...')
//       // Try to trigger connect manually if auto-connect failed
//       if (mockWallet.connect) {
//         console.log('� [AutoConnectMockWallet] Manually connecting mock wallet...')
//         mockWallet.connect()
//       }
//     }
//   }, [wagmiConnected, mockWallet])

//   return null // This component doesn't render anything
// }

// export default AutoConnectMockWallet
