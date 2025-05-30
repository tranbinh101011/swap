import { ChainId, getChainName } from '@pancakeswap/chains'
import { useTranslation } from '@pancakeswap/localization'
import { Token } from '@pancakeswap/sdk'
import {
  ArrowForwardIcon,
  Box,
  Button,
  ButtonMenu,
  ButtonMenuItem,
  FlexGap,
  Modal,
  ModalHeader,
  ModalV2,
  Skeleton,
  Text,
  useMatchBreakpoints,
} from '@pancakeswap/uikit'

import { RecentTransactions } from 'components/App/Transactions/TransactionsModal'
import CurrencyLogo from 'components/Logo/CurrencyLogo'

import { TabsComponent, WalletView } from 'components/Menu/UserMenu/WalletModal'
import { ASSET_CDN } from 'config/constants/endpoints'
import { useAddressBalance } from 'hooks/useAddressBalance'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo, useState } from 'react'
import styled from 'styled-components'
import { formatAmount } from 'utils/formatInfoNumbers'
import { CopyAddress } from './WalletCopyButton'

interface WalletModalProps {
  isOpen: boolean
  account?: string
  onDismiss: () => void
  onReceiveClick: () => void
  onDisconnect: () => void
}

const StyledModal = styled(Modal)`
  width: 100%;
  border-radius: 24px;
  padding: 0;
  overflow: hidden;
  ${ModalHeader} {
    display: none;
  }
`

const TotalBalanceInteger = styled(Text)`
  font-size: 40px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
`

const TotalBalanceDecimal = styled(Text)`
  font-size: 40px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textSubtle};
`

const StyledButtonMenu = styled(ButtonMenu)`
  width: 100%;
  background-color: ${({ theme }) => theme.colors.input};
  border-radius: 16px;
  padding: 0;
  margin: 0 0 16px 0;
  border: none;
`

const StyledButtonMenuItem = styled(ButtonMenuItem)`
  height: 40px;
  border-radius: 16px;
  font-size: 16px;
  font-weight: 600;
  flex: 1;
`
const SCROLLBAR_SHIFT_PX = 8

const AssetList = styled(Box)`
  max-height: 280px;
  overflow-y: auto;
  padding: 0;
  width: calc(100% + ${SCROLLBAR_SHIFT_PX}px);
  margin-right: -${SCROLLBAR_SHIFT_PX}px;
  padding-right: ${SCROLLBAR_SHIFT_PX}px;
  ${({ theme }) => theme.mediaQueries.md} {
    max-height: 340px;
  }
`

const AssetItem = styled(FlexGap)`
  padding: 4px 0px;
  margin-bottom: 8px;
  align-items: center;
  justify-content: space-between;
  border-radius: 16px;
  cursor: pointer;
  overflow: hidden;
`

const TokenIcon = styled(Box)`
  width: 40px;
  height: 40px;
  margin-right: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
`

const ChainIconWrapper = styled(Box)`
  position: absolute;
  bottom: -4px;
  right: -4px;
  background: ${({ theme }) => theme.colors.background};
  border-radius: 50%;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 1;
`

const ActionButtonsContainer = styled(FlexGap)`
  padding: 16px 0px;
  justify-content: center;
  flex-direction: column;
  gap: 8px;
  ${({ theme }) => theme.mediaQueries.md} {
    padding: 16px;
  }
`

const ActionButton = styled(Button)`
  width: 100%;
  border-radius: 16px;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textSubtle};
  background-color: ${({ theme }) => theme.colors.input};
  box-shadow: 0px -2px 0px 0px #0000001a inset;
`

const BridgeButton = styled(ActionButton)`
  background: transparent;
  color: ${({ theme }) => theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`

const DisconnectButton = styled(Button)`
  border-radius: 8px;
  height: 26px;
  background-color: ${({ theme }) => theme.colors.tertiary};
  color: ${({ theme }) => theme.colors.primary60};
  border-bottom: 2px solid #0000001a;
  &:hover {
    opacity: 0.8;
  }
`

const OptionBox = styled(Box)`
  background: ${({ theme }) => theme.colors.input};
  border-radius: 24px;
  padding: 16px;
  width: 45%;
  border: 1px solid ${({ theme }) => (theme.isDark ? '#55496E' : '#D7CAEC')};
  text-align: center;
  cursor: pointer;
`

const WalletModal: React.FC<WalletModalProps> = ({ account, onDismiss, isOpen, onReceiveClick, onDisconnect }) => {
  // If no account is provided, show a message or redirect
  if (!account) {
    return null
  }
  return (
    <ModalV2 isOpen={isOpen} onDismiss={onDismiss} closeOnOverlayClick>
      <StyledModal title={undefined} onDismiss={onDismiss} hideCloseButton bodyPadding="16px">
        <WalletContent
          account={account}
          onDisconnect={onDisconnect}
          onDismiss={onDismiss}
          onReceiveClick={onReceiveClick}
        />
      </StyledModal>
    </ModalV2>
  )
}

export const WalletContent = ({
  account,
  onDismiss,
  onReceiveClick,
  onDisconnect,
}: {
  account: string | undefined
  onDismiss: () => void
  onReceiveClick: () => void
  onDisconnect: () => void
}) => {
  const [view, setView] = useState(WalletView.WALLET_INFO)
  const { t } = useTranslation()

  const router = useRouter()
  const { isMobile } = useMatchBreakpoints()

  // Fetch balances using the hook we created
  const { balances, isLoading, totalBalanceUsd } = useAddressBalance(account, {
    includeSpam: false,
    onlyWithPrice: true,
  })
  const balanceDisplay = useMemo(() => {
    const display = formatAmount(totalBalanceUsd)?.split('.')
    return {
      integer: display?.[0] || '',
      decimal: display?.[1] || '',
    }
  }, [totalBalanceUsd])

  // Get top tokens by value
  const topTokens = balances
  const noAssets = topTokens.length === 0 && !isLoading
  const handleClick = useCallback((newIndex: number) => {
    setView(newIndex)
  }, [])

  return (
    <Box
      minWidth={isMobile ? '100%' : '357px'}
      maxHeight={isMobile ? 'auto' : 'calc(100vh - 80px)'}
      overflowY={isMobile ? undefined : 'auto'}
    >
      <FlexGap mb="10px" gap="8px" justifyContent="space-between" alignItems="center" paddingRight="16px">
        <CopyAddress tooltipMessage={t('Copied')} account={account || ''} />
        <FlexGap>
          <DisconnectButton scale="xs" onClick={onDisconnect}>
            {t('Disconnect')}
          </DisconnectButton>
        </FlexGap>
      </FlexGap>
      <Box padding={isMobile ? '0' : '0 16px 16px'}>
        <FlexGap alignItems="center" gap="3px">
          <TotalBalanceInteger>${balanceDisplay.integer}</TotalBalanceInteger>
          <TotalBalanceDecimal>.{balanceDisplay.decimal}</TotalBalanceDecimal>
        </FlexGap>
        <Text fontSize="20px" fontWeight="bold" mb="8px">
          {t('My Wallet')}
        </Text>
        {!noAssets && (
          <Box mb="16px" onClick={(e) => e.stopPropagation()}>
            <TabsComponent
              view={view}
              handleClick={handleClick}
              style={{ backgroundColor: 'transparent', padding: '0', borderBottom: 'none' }}
            />
          </Box>
        )}
        {view === WalletView.WALLET_INFO && !noAssets ? (
          <AssetList>
            {isLoading ? (
              <FlexGap justifyContent="center" padding="4px" flexDirection="column" gap="8px">
                <Skeleton height="55px" width="100%" />
                <Skeleton height="55px" width="100%" />
                <Skeleton height="55px" width="100%" />
                <Skeleton height="55px" width="100%" />
                <Skeleton height="55px" width="100%" />
                <Skeleton height="55px" width="100%" />
              </FlexGap>
            ) : topTokens.length === 0 ? null : (
              topTokens.map((asset) => {
                const token = new Token(
                  asset.chainId,
                  asset.token.address as `0x${string}`,
                  asset.token.decimals,
                  asset.token.symbol,
                  asset.token.name,
                )
                const chainName = asset.chainId === ChainId.BSC ? 'BNB' : getChainName(asset.chainId)
                return (
                  <AssetItem key={asset.id}>
                    <FlexGap alignItems="center">
                      <TokenIcon>
                        <CurrencyLogo currency={token} src={asset.token.logoURI} size="40px" />
                        <ChainIconWrapper>
                          <img
                            src={`${ASSET_CDN}/web/chains/${asset.chainId}.png`}
                            alt={`${chainName}-logo`}
                            width="12px"
                            height="12px"
                          />
                        </ChainIconWrapper>
                      </TokenIcon>
                      <Box>
                        <FlexGap alignItems="center">
                          <Text
                            bold
                            fontSize="16px"
                            style={{
                              maxWidth: '70px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {asset.token.symbol}
                          </Text>
                          <Text
                            ml="8px"
                            color="textSubtle"
                            fontSize="14px"
                            style={{
                              maxWidth: '60px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {asset.token.name}
                          </Text>
                        </FlexGap>

                        <Text fontSize="12px" color="textSubtle" textTransform="uppercase" bold>
                          {chainName} {t('Chain')}
                        </Text>
                      </Box>
                    </FlexGap>
                    <Box style={{ textAlign: 'right' }}>
                      <Text bold fontSize="14px">
                        {parseFloat(asset.quantity) < 0.000001
                          ? '<0.000001'
                          : parseFloat(asset.quantity).toLocaleString(undefined, {
                              maximumFractionDigits:
                                asset?.price?.totalUsd !== undefined &&
                                asset?.price?.totalUsd !== null &&
                                asset?.price?.totalUsd > 0 &&
                                asset?.price?.totalUsd < 1
                                  ? 6
                                  : 4,
                              minimumFractionDigits: 2,
                            })}
                      </Text>
                      <Text color="textSubtle" fontSize="14px">
                        {asset.price?.totalUsd
                          ? asset.price?.totalUsd < 0.01
                            ? '<$0.01'
                            : `$${formatAmount(asset.price.totalUsd)}`
                          : '$0.00'}
                      </Text>
                    </Box>
                  </AssetItem>
                )
              })
            )}
          </AssetList>
        ) : (
          !noAssets && (
            <Box padding="16px 0" maxHeight="280px" overflow="auto">
              <RecentTransactions />
            </Box>
          )
        )}
      </Box>
      {noAssets ? (
        <Box padding="8px 16px">
          <Text color="textSubtle" textAlign="center" mb="16px">
            {t('This wallet looks new — choose an option below to add crypto and start trading')}
          </Text>
          <FlexGap gap="16px" justifyContent="center" flexWrap="wrap">
            <OptionBox
              onClick={() => {
                router.push('/buy-crypto')
                onDismiss()
              }}
            >
              <Box mb="16px" mx="auto" width="60px" height="60px">
                <img src={`${ASSET_CDN}/web/landing/trade-buy-crypto.png`} width="60px" alt="Buy Crypto" />
              </Box>
              <Text bold color="secondary" fontSize="16px" mb="8px">
                {t('Buy')}
              </Text>
              <Text fontSize="14px" color="textSubtle">
                {t('Purchase with credit card, Apple Pay, or Google Pay.')}
              </Text>
            </OptionBox>
            <OptionBox
              onClick={() => {
                onReceiveClick()
                onDismiss()
              }}
            >
              <Box mb="16px" mx="auto" width="60px" height="60px">
                <img src={`${ASSET_CDN}/web/landing/earn-fixed-staking.png`} width="60px" alt="Receive Crypto" />
              </Box>
              <Text bold color="secondary" fontSize="16px" mb="8px">
                {t('Receive')}
              </Text>
              <Text fontSize="14px" color="textSubtle">
                {t('Receive crypto from another wallet.')}
              </Text>
            </OptionBox>
          </FlexGap>
          <FlexGap
            justifyContent="center"
            alignItems="center"
            mt="24px"
            onClick={() => {
              router.push('/bridge')
            }}
            style={{ cursor: 'pointer' }}
          >
            <Text bold color="primary" fontSize="16px">
              {t('Bridge Crypto')}
            </Text>
            <ArrowForwardIcon color="primary" />
          </FlexGap>
        </Box>
      ) : (
        <ActionButtonsContainer>
          <FlexGap gap="8px" width="100%">
            <ActionButton
              onClick={() => {
                router.push('/buy-crypto')
                onDismiss()
              }}
              variant="tertiary"
            >
              {t('Buy')}
            </ActionButton>
            <ActionButton
              onClick={(e) => {
                onReceiveClick()
              }}
              variant="tertiary"
            >
              {t('Receive')}
            </ActionButton>
          </FlexGap>

          <Button
            variant="text"
            onClick={() => {
              router.push('/bridge')
              onDismiss()
            }}
          >
            {t('Bridge Crypto')}
            <ArrowForwardIcon color="primary" />
          </Button>
        </ActionButtonsContainer>
      )}
    </Box>
  )
}

export default WalletModal
