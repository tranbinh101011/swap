import { useTranslation } from '@pancakeswap/localization'
import { Box, UserMenu as UIKitUserMenu, UserMenuVariant, useMatchBreakpoints } from '@pancakeswap/uikit'
import ConnectWalletButton from 'components/ConnectWalletButton'
import useAirdropModalStatus from 'components/GlobalCheckClaimStatus/hooks/useAirdropModalStatus'
import Trans from 'components/Trans'
import { WalletContent, WalletModalV2 } from 'components/WalletModalV2'
import ReceiveModal from 'components/WalletModalV2/ReceiveModal'
import { useActiveChainId } from 'hooks/useActiveChainId'
import useAuth from 'hooks/useAuth'
import { useDomainNameForAddress } from 'hooks/useDomain'
import { useCallback, useEffect, useState } from 'react'
import { useProfile } from 'state/profile/hooks'
import { usePendingTransactions } from 'state/transactions/hooks'
import { logGTMDisconnectWalletEvent } from 'utils/customGTMEventTracking'
import { useAccount } from 'wagmi'

const UserMenuItems = ({ onReceiveClick }: { onReceiveClick: () => void }) => {
  const { t } = useTranslation()
  const { chainId, isWrongNetwork } = useActiveChainId()
  const { logout } = useAuth()
  const { address: account, connector } = useAccount()
  const { hasPendingTransactions } = usePendingTransactions()
  const { isInitialized, isLoading, profile } = useProfile()
  const { shouldShowModal } = useAirdropModalStatus()

  const hasProfile = isInitialized && !!profile

  // Use PancakeSwap's breakpoint system
  const { isMobile } = useMatchBreakpoints()
  const isMobileView = isMobile

  const handleClickDisconnect = useCallback(() => {
    logGTMDisconnectWalletEvent(chainId, connector?.name, account)
    logout()
  }, [logout, connector?.name, account, chainId])

  return (
    <WalletContent
      account={account}
      onDismiss={() => {}}
      onReceiveClick={onReceiveClick}
      onDisconnect={handleClickDisconnect}
    />
  )
}

const UserMenu = () => {
  const { t } = useTranslation()
  const { address: account, connector } = useAccount()
  const { chainId, isWrongNetwork } = useActiveChainId()
  const { domainName, avatar } = useDomainNameForAddress(account)
  const { logout } = useAuth()
  const { hasPendingTransactions, pendingNumber } = usePendingTransactions()
  const { profile } = useProfile()
  const avatarSrc = profile?.nft?.image?.thumbnail ?? avatar
  const [userMenuText, setUserMenuText] = useState<string>('')
  const [userMenuVariable, setUserMenuVariable] = useState<UserMenuVariant>('default')
  const { isMobile } = useMatchBreakpoints()
  // State for mobile modal
  const [showMobileWalletModal, setShowMobileWalletModal] = useState(false)
  const [showDesktopPopup] = useState(true)
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false)

  useEffect(() => {
    if (hasPendingTransactions) {
      setUserMenuText(t('%num% Pending', { num: pendingNumber }))
      setUserMenuVariable('pending')
    } else {
      setUserMenuText('')
      setUserMenuVariable('default')
    }
  }, [hasPendingTransactions, pendingNumber, t])

  const handleClickDisconnect = useCallback(() => {
    logGTMDisconnectWalletEvent(chainId, connector?.name, account)
    logout()
  }, [logout, connector?.name, account, chainId])

  if (account) {
    return (
      <>
        <UIKitUserMenu
          account={domainName || account}
          ellipsis={!domainName}
          avatarSrc={avatarSrc}
          text={userMenuText}
          variant={userMenuVariable}
          popperStyle={{
            minWidth: '380px',
          }}
          onClick={() => {
            if (isMobile) {
              setShowMobileWalletModal(true)
            }
          }}
        >
          {!isMobile
            ? () =>
                showDesktopPopup ? <UserMenuItems onReceiveClick={() => setIsReceiveModalOpen(true)} /> : undefined // ({ isOpen }) => isOpen ||showDesktopPopup && <UserMenuItems onReceiveClick={() => setIsReceiveModalOpen(true)} />
            : undefined}
        </UIKitUserMenu>

        <WalletModalV2
          isOpen={showMobileWalletModal}
          account={account}
          onReceiveClick={() => setIsReceiveModalOpen(true)}
          onDisconnect={handleClickDisconnect}
          onDismiss={() => setShowMobileWalletModal(false)}
        />
        {account && (
          <ReceiveModal account={account} onDismiss={() => setIsReceiveModalOpen(false)} isOpen={isReceiveModalOpen} />
        )}
      </>
    )
  }

  if (isWrongNetwork) {
    return (
      <UIKitUserMenu text={t('Network')} variant="danger">
        {!isMobile
          ? ({ isOpen }) => isOpen && <UserMenuItems onReceiveClick={() => setIsReceiveModalOpen(true)} />
          : undefined}
      </UIKitUserMenu>
    )
  }

  return (
    <ConnectWalletButton scale="sm">
      <Box display={['none', null, null, 'block']}>
        <Trans>Connect Wallet</Trans>
      </Box>
      <Box display={['block', null, null, 'none']}>
        <Trans>Connect</Trans>
      </Box>
    </ConnectWalletButton>
  )
}

export default UserMenu
