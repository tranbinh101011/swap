import { UnifiedWalletButton } from '@jup-ag/wallet-adapter'
import { useTranslation } from '@pancakeswap/localization'
import { UserMenu as UIKitUserMenu, UserMenuItem } from '@pancakeswap/uikit'
import { useWallet } from '@solana/wallet-adapter-react'
import { FC, useMemo } from 'react'
import styled from 'styled-components'

const StyledUserMenuItem = styled(UserMenuItem)`
  padding: 7px 10px;
  height: auto;
  line-height: 1.5;
  font-size: 14px;
  background: ${({ theme }) => theme.colors.card};
  margin-top: 15px;
  border-radius: 5px !important;
`

const UserMenuItems = () => {
  const { t } = useTranslation()
  const { disconnect } = useWallet()
  return (
    <StyledUserMenuItem as="button" onClick={disconnect}>
      {t('Disconnect')}
    </StyledUserMenuItem>
  )
}
export const WalletButton: FC = () => {
  const { publicKey, connected, connecting, wallet } = useWallet()
  const base58 = useMemo(() => publicKey?.toBase58(), [publicKey])

  if ((!connected && !connecting) || !base58) {
    return <UnifiedWalletButton buttonClassName="pcs-connect-btn" />
  }

  return (
    <UIKitUserMenu
      popperStyle={{ width: '150px', background: 'transparent', border: 'none' }}
      avatarSrc={wallet?.adapter.icon}
      account={base58}
    >
      {({ isOpen }) => (isOpen ? <UserMenuItems /> : null)}
    </UIKitUserMenu>
  )
}
