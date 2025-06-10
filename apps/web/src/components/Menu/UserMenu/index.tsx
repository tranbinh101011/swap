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
import { useCallback, useEffect, useRef, useState } from 'react'
import { useProfile } from 'state/profile/hooks'
import { usePendingTransactions } from 'state/transactions/hooks'
import styled from 'styled-components'
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

// Custom wrapper for UIKitUserMenu that adds click functionality for desktop
const ClickableUserMenu = styled.div`
  position: relative;
`

const ClickablePopover = styled.div<{ isOpen: boolean }>`
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 1001;
  min-width: 380px;
  background-color: ${({ theme }) => theme.card.background};
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: 16px;
  margin-top: 8px;
  visibility: ${({ isOpen }) => (isOpen ? 'visible' : 'hidden')};
  opacity: ${({ isOpen }) => (isOpen ? 1 : 0)};
  transition: visibility 0.2s, opacity 0.2s;
`

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

  // State for click-based menu
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if the click target is within portal-root

      const portalRoot = document.getElementById('portal-root')
      const isClickInPortal = portalRoot?.contains(event.target as Node)

      // Only close if click is outside menu and not in portal-root
      if (menuRef.current && !menuRef.current.contains(event.target as Node) && !isClickInPortal) {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [menuRef])

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
        <ClickableUserMenu ref={menuRef}>
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
              } else {
                // Toggle menu on click for desktop
                setIsMenuOpen((prev) => !prev)
              }
            }}
          >
            {/* Make sure the menu won't be triggered by hover */}
            {undefined}
          </UIKitUserMenu>

          {/* Custom click-based menu for desktop */}
          {!isMobile && (
            <ClickablePopover isOpen={isMenuOpen}>
              {isMenuOpen && showDesktopPopup && <UserMenuItems onReceiveClick={() => setIsReceiveModalOpen(true)} />}
            </ClickablePopover>
          )}
        </ClickableUserMenu>

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
      <ClickableUserMenu ref={menuRef}>
        <UIKitUserMenu
          text={t('Network')}
          variant="danger"
          onClick={() => {
            if (!isMobile) {
              setIsMenuOpen((prev) => !prev)
            }
          }}
        >
          {!isMobile && !isMenuOpen
            ? ({ isOpen }) => isOpen && <UserMenuItems onReceiveClick={() => setIsReceiveModalOpen(true)} />
            : undefined}
        </UIKitUserMenu>

        {/* Custom click-based menu for desktop */}
        {!isMobile && (
          <ClickablePopover isOpen={isMenuOpen}>
            {isMenuOpen && <UserMenuItems onReceiveClick={() => setIsReceiveModalOpen(true)} />}
          </ClickablePopover>
        )}
      </ClickableUserMenu>
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
