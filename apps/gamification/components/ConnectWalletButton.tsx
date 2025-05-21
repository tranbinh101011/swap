import { Trans, useTranslation } from '@pancakeswap/localization'
import { WalletConfigV2, WalletModalV2 } from '@pancakeswap/ui-wallets'
import { Button, ButtonProps } from '@pancakeswap/uikit'
import { ConnectorNames, createWallets, getDocLink, TOP_WALLET_MAP } from 'config/wallet'
import { useActiveChainId } from 'hooks/useActiveChainId'
import useAuth from 'hooks/useAuth'

// @ts-ignore
// eslint-disable-next-line import/extensions
import { ChainId } from '@pancakeswap/chains'
import { useMemo, useState } from 'react'
import { useConnect } from 'wagmi'

const ConnectWalletButton = ({ children, ...props }: ButtonProps) => {
  const { login } = useAuth()
  const {
    t,
    currentLanguage: { code },
  } = useTranslation()
  const { connectAsync } = useConnect()
  const { chainId } = useActiveChainId()
  const [open, setOpen] = useState(false)

  const docLink = useMemo(() => getDocLink(code), [code])

  const handleClick = () => {
    setOpen(true)
  }

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

  return (
    <>
      <Button onClick={handleClick} {...props}>
        {children || <Trans>Connect Wallet</Trans>}
      </Button>
      <style jsx global>{`
        w3m-modal,
        wcm-modal {
          position: relative;
          z-index: 99;
        }
      `}</style>
      <WalletModalV2
        topWallets={topWallets}
        mevDocLink={null}
        docText={t('Learn How to Connect')}
        docLink={docLink}
        isOpen={open}
        wallets={wallets}
        login={login}
        onDismiss={() => setOpen(false)}
      />
    </>
  )
}

export default ConnectWalletButton
