import { useTranslation } from '@pancakeswap/localization'
import { WalletModalV2 } from '@pancakeswap/ui-wallets'
import { ConnectorNames, createWallets, getDocLink, mevDocLink, TOP_WALLET_MAP } from 'config/wallet'
import { useActiveChainId } from 'hooks/useActiveChainId'
import useAuth from 'hooks/useAuth'

import { ChainId } from '@pancakeswap/chains'
import { WalletConfigV2 } from '@pancakeswap/ui-wallets/src/types'
// import { useFirebaseAuth } from 'contexts/Privy/firebase' // Removed Firebase dependency
import { useCallback, useMemo } from 'react'
import { logGTMWalletConnectedEvent } from 'utils/customGTMEventTracking'
import { useConnect } from 'wagmi'

const WalletModalManager: React.FC<{ isOpen: boolean; onDismiss?: () => void }> = ({ isOpen, onDismiss }) => {
  const { login } = useAuth()
  const {
    t,
    currentLanguage: { code },
  } = useTranslation()
  const { connectAsync } = useConnect()
  const { chainId } = useActiveChainId()

  const docLink = useMemo(() => getDocLink(code), [code])

  const wallets = useMemo(() => createWallets(chainId || ChainId.BSC, connectAsync), [chainId, connectAsync])
  const topWallets = useMemo(
    () =>
      TOP_WALLET_MAP[chainId]
        ? TOP_WALLET_MAP[chainId]
            .map((id) => wallets.find((w) => w.id === id))
            .filter<WalletConfigV2<ConnectorNames>>((w): w is WalletConfigV2<ConnectorNames> => Boolean(w))
        : [],
    [wallets, chainId],
  )

  const handleWalletConnect = useCallback(
    (name?: string, address?: string) => {
      logGTMWalletConnectedEvent(chainId, name, address)
    },
    [chainId],
  )

  // Mock Firebase auth functions (removed dependency)
  const loginWithGoogle = useCallback(() => console.log('🔄 Google login (disabled)'), [])
  const loginWithX = useCallback(() => console.log('🔄 X login (disabled)'), [])
  const loginWithDiscord = useCallback(() => console.log('🔄 Discord login (disabled)'), [])
  const loginWithTelegram = useCallback(() => console.log('🔄 Telegram login (disabled)'), [])
  const isLoading = false

  return (
    <WalletModalV2
      mevDocLink={mevDocLink}
      docText={t('Learn How to Connect')}
      docLink={docLink}
      isOpen={isOpen}
      wallets={wallets}
      topWallets={topWallets}
      login={login}
      onDismiss={onDismiss}
      onWalletConnectCallBack={handleWalletConnect}
      onGoogleLogin={loginWithGoogle}
      onXLogin={loginWithX}
      onTelegramLogin={loginWithTelegram}
      onDiscordLogin={loginWithDiscord}
    />
  )
}

export default WalletModalManager
