import { Button, ButtonProps, FlexGap, WalletFilledV2Icon, Text } from '@pancakeswap/uikit'
import { useCallback, useState } from 'react'
import WalletModalManager from 'components/WalletModalManager'
import { logGTMConnectWalletEvent } from 'utils/customGTMEventTracking'
import { useActiveChainId } from 'hooks/useActiveChainId'
import { useMockWalletContext } from 'contexts/MockWalletContext'
import { useAccount } from 'wagmi'
import Trans from './Trans'

interface MockWalletConnectButtonProps extends ButtonProps {
  withIcon?: boolean
  children?: React.ReactNode
}

const MockWalletConnectButton = ({ children, withIcon, ...props }: MockWalletConnectButtonProps) => {
  const [openWalletModal, setOpenWalletModal] = useState(false)
  const { chainId } = useActiveChainId()
  const { mockWallet } = useMockWalletContext()
  const { isConnected: wagmiConnected, address: wagmiAddress } = useAccount()

  const handleOnDismiss = useCallback(() => setOpenWalletModal(false), [])

  const handleConnectBtnClick = useCallback(() => {
    console.log('🔗 [MockWalletConnectButton] Connect button clicked')
    console.log('🔑 [MockWalletConnectButton] Mock wallet status:', {
      isConnected: mockWallet.isConnected,
      isAutoConnected: mockWallet.isAutoConnected,
      address: mockWallet.address
    })

    // Luôn mở wallet modal để user có thể chọn wallet thực tế
    console.log('🎯 [MockWalletConnectButton] Opening wallet modal for real wallet connection')
    logGTMConnectWalletEvent(chainId)
    setOpenWalletModal(true)
  }, [chainId, mockWallet])

  // Hiển thị trạng thái kết nối
  const getButtonContent = () => {
    // Ưu tiên hiển thị trạng thái wagmi wallet (wallet thực tế)
    if (wagmiConnected && wagmiAddress) {
      return (
        <FlexGap gap="8px" justifyContent="center" alignItems="center">
          <Text color="invertedContrast" fontSize="14px">
            Wallet Connected
          </Text>
          {withIcon && <WalletFilledV2Icon color="invertedContrast" />}
        </FlexGap>
      )
    }

    // Nếu chỉ có mock wallet connected
    if (mockWallet.isConnected && mockWallet.address) {
      return (
        <FlexGap gap="8px" justifyContent="center" alignItems="center">
          <Text color="invertedContrast" fontSize="14px">
            Mock Wallet (Click to Connect Real Wallet)
          </Text>
          {withIcon && <WalletFilledV2Icon color="invertedContrast" />}
        </FlexGap>
      )
    }

    return (
      <FlexGap gap="8px" justifyContent="center" alignItems="center">
        {children || <Trans>Connect Wallet</Trans>}
        {withIcon && <WalletFilledV2Icon color="invertedContrast" />}
      </FlexGap>
    )
  }

  // Xác định variant button
  const getButtonVariant = () => {
    if (wagmiConnected && wagmiAddress) {
      return "secondary" // Wallet thực tế đã connected
    }
    return "primary" // Chưa có wallet thực tế hoặc chỉ có mock wallet
  }

  return (
    <>
      <Button 
        onClick={handleConnectBtnClick} 
        disabled={false} // Luôn cho phép click để connect wallet thực tế
        variant={getButtonVariant()}
        {...props}
      >
        {getButtonContent()}
      </Button>
      
      <style jsx global>{`
        w3m-modal {
          position: fixed;
          z-index: 100000000;
        }
      `}</style>
      
      <WalletModalManager isOpen={openWalletModal} onDismiss={handleOnDismiss} />
    </>
  )
}

export default MockWalletConnectButton
