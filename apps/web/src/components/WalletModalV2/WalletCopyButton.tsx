import { previouslyUsedWalletsAtom } from '@pancakeswap/ui-wallets'
import { Box, CopyButton, Flex, FlexProps, Image, Text, WalletFilledV2Icon } from '@pancakeswap/uikit'
import { useQuery } from '@tanstack/react-query'
import { ASSET_CDN } from 'config/constants/endpoints'
import { walletsConfig } from 'config/wallet'
import { useActiveChainId } from 'hooks/useActiveChainId'
import { useAtom } from 'jotai'
import { useMemo } from 'react'
import { styled } from 'styled-components'
import { Connector, useAccount, useConnect } from 'wagmi'

interface CopyAddressProps extends FlexProps {
  account: string | undefined
  tooltipMessage: string
}

const Wrapper = styled(Flex)`
  align-items: center;
  justify-content: flex-start;
  border-radius: 16px;
  position: relative;
  padding: 8px 16px;
`

const WalletIcon = styled(Box)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  margin-right: 12px;
  flex-shrink: 0;
  border-radius: 8px;
  overflow: hidden;
`

const AddressBox = styled(Box)`
  display: flex;
  flex-direction: column;
  flex: 1;
`

const WalletAddress = styled(Text)`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.primary};
  margin-right: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
`

const CopyButtonWrapper = styled(Box)`
  margin-left: 8px;
`
const DAPP_LIST = [
  'isBinance',
  'isCoinbaseWallet',
  'isOkxWallet',
  'isTokenPocket',
  'isSafePal',
  'isTrust',
  'isTrustWallet',
  'isBraveWallet',
  'isWalletConnect',
  'isOpera',
  'isRabby',
  'isMathWallet',
  'isCoin98',
  'isBlocto',
  'isCyberWallet',
]
const DAPP_WALLET_ICON = {
  [DAPP_LIST[0]]: `${ASSET_CDN}/web/wallets/binance-w3w.png`,
  [DAPP_LIST[1]]: `${ASSET_CDN}/web/wallets/coinbase.png`,
  [DAPP_LIST[2]]: `${ASSET_CDN}/web/wallets/okx-wallet.png`,
  [DAPP_LIST[3]]: `${ASSET_CDN}/web/wallets/tokenpocket.png`,
  [DAPP_LIST[4]]: `${ASSET_CDN}/web/wallets/safepal.png`,
  [DAPP_LIST[5]]: `${ASSET_CDN}/web/wallets/trust.png`,
  [DAPP_LIST[6]]: `${ASSET_CDN}/web/wallets/trust.png`,
  [DAPP_LIST[7]]: `${ASSET_CDN}/web/wallets/brave.png`,
  [DAPP_LIST[8]]: `${ASSET_CDN}/web/wallets/walletconnect.png`,
  [DAPP_LIST[9]]: `${ASSET_CDN}/web/wallets/opera.png`,
  [DAPP_LIST[10]]: `${ASSET_CDN}/web/wallets/rabby.png`,
  [DAPP_LIST[11]]: `${ASSET_CDN}/web/wallets/mathwallet.png`,
  [DAPP_LIST[12]]: `${ASSET_CDN}/web/wallets/coin98.png`,
  [DAPP_LIST[13]]: `${ASSET_CDN}/web/wallets/blocto.png`,
  [DAPP_LIST[14]]: `${ASSET_CDN}/web/wallets/cyberwallet.png`,
}

const getDappIcon = async (connector?: Connector) => {
  if (!connector || typeof connector.getProvider !== 'function') return undefined
  const provider = (await connector?.getProvider()) as any
  const walletName = DAPP_LIST.find((d) => provider?.[d] === true)
  if (!walletName) return undefined
  return DAPP_WALLET_ICON?.[walletName]
}

const useDappIcon = () => {
  const { connector } = useAccount()
  const { data: dappIcon } = useQuery({
    queryKey: ['dappIcon', connector?.uid],
    queryFn: () => getDappIcon(connector!),
  })
  return { dappIcon }
}

export const CopyAddress: React.FC<React.PropsWithChildren<CopyAddressProps>> = ({
  account,
  tooltipMessage,
  ...props
}) => {
  const { connectAsync } = useConnect()
  const { chainId } = useActiveChainId()

  const [previouslyUsedWalletsId] = useAtom(previouslyUsedWalletsAtom)

  const walletConfig = walletsConfig({ chainId, connect: connectAsync })

  const wallet = useMemo(() => walletConfig.find((w) => w.id === previouslyUsedWalletsId[0]), [walletConfig])
  const { dappIcon } = useDappIcon()

  // Format the address to show only the first 6 and last 4 characters
  const formatAddress = (address: string | undefined) => {
    if (!address) return ''
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }

  return (
    <Box position="relative" {...props} onClick={(e) => e.stopPropagation()}>
      <Wrapper>
        <WalletIcon>
          {wallet?.icon || dappIcon ? (
            <Image src={(wallet?.icon as string) || dappIcon} width={40} height={40} alt="Wallet" />
          ) : (
            <WalletFilledV2Icon width={28} height={28} color="primary" />
          )}
        </WalletIcon>
        <AddressBox>
          <WalletAddress title={account}>{formatAddress(account)}</WalletAddress>
        </AddressBox>
        <CopyButtonWrapper>
          <CopyButton width="16px" text={account ?? ''} tooltipMessage={tooltipMessage} />
        </CopyButtonWrapper>
      </Wrapper>
    </Box>
  )
}
