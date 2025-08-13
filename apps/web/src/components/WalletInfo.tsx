import { Box, Card, Flex, Text } from '@pancakeswap/uikit'
import { useMockWalletContext } from 'contexts/MockWalletContext'
import { useActiveWallet } from 'hooks/useActiveWallet'
import { useAccount, useBalance } from 'wagmi'
import { truncateAddress } from 'utils/truncateAddress'

const WalletInfo = () => {
  const { mockWallet } = useMockWalletContext()
  const { address, isConnected, source } = useActiveWallet()
  const { isConnected: wagmiConnected } = useAccount()
  const { data: wagmiBalance } = useBalance({ 
    address: address as `0x${string}`,
    enabled: wagmiConnected && source === 'wagmi'
  })

  if (!isConnected || !address) {
    return null
  }

  // Xác định thông tin hiển thị dựa trên source
  const getWalletInfo = () => {
    if (source === 'wagmi') {
      return {
        title: '💼 Real Wallet Connected',
        balance: wagmiBalance ? parseFloat(wagmiBalance.formatted).toFixed(4) : '0.0000',
        symbol: wagmiBalance?.symbol || 'BNB',
        isAutoConnected: false
      }
    } else {
      return {
        title: '🔑 Mock Wallet (Auto)',
        balance: parseFloat(mockWallet.balance).toFixed(4),
        symbol: 'BNB',
        isAutoConnected: true
      }
    }
  }

  const walletInfo = getWalletInfo()

  return (
    <Card 
      mb="16px" 
      p="12px" 
      style={{ 
        background: source === 'wagmi' 
          ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' // Green for real wallet
          : 'linear-gradient(135deg, #7928CA 0%, #FF0080 100%)', // Purple for mock wallet
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}
    >
      <Flex alignItems="center" justifyContent="space-between">
        <Flex flexDirection="column" gap="4px">
          <Text color="white" fontSize="12px" fontWeight="600">
            {walletInfo.title}
          </Text>
          <Text color="rgba(255, 255, 255, 0.8)" fontSize="14px" fontFamily="monospace">
            {truncateAddress(address)}
          </Text>
        </Flex>
        <Flex flexDirection="column" alignItems="flex-end" gap="4px">
          <Text color="white" fontSize="12px" fontWeight="600">
            Balance
          </Text>
          <Text color="rgba(255, 255, 255, 0.8)" fontSize="14px" fontWeight="bold">
            {walletInfo.balance} {walletInfo.symbol}
          </Text>
        </Flex>
      </Flex>
      
      {walletInfo.isAutoConnected && (
        <Box mt="8px">
          <Text color="rgba(255, 255, 255, 0.6)" fontSize="10px" textAlign="center">
            Using mock wallet automatically. Click "Connect Wallet" to use a different wallet.
          </Text>
        </Box>
      )}
    </Card>
  )
}

export default WalletInfo
