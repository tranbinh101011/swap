import { useTranslation } from '@pancakeswap/localization'
import { Token } from '@pancakeswap/sdk'
import {
  ArrowBackIcon,
  ArrowForwardIcon,
  Box,
  Button,
  ButtonMenu,
  ButtonMenuItem,
  FlexGap,
  Modal,
  ModalHeader,
  ModalV2,
  Text,
  useMatchBreakpoints,
} from '@pancakeswap/uikit'

import { RecentTransactions } from 'components/App/Transactions/TransactionsModal'

import { useTheme } from '@pancakeswap/hooks'
import { TabsComponent, WalletView } from 'components/Menu/UserMenu/WalletModal'
import { ASSET_CDN } from 'config/constants/endpoints'
import { useAddressBalance } from 'hooks/useAddressBalance'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo, useState } from 'react'
import styled from 'styled-components'
import { formatAmount } from 'utils/formatInfoNumbers'
import { ActionButton } from './ActionButton'
import { AssetsList } from './AssetsList'
import { SendAssets } from './SendAssets'
import { CopyAddress } from './WalletCopyButton'
import { ViewState } from './type'

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

const ActionButtonsContainer = styled(FlexGap)`
  padding: 16px 0px;
  justify-content: center;
  flex-direction: column;
  gap: 8px;
  ${({ theme }) => theme.mediaQueries.md} {
    padding: 16px;
  }
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
  const [viewState, setViewState] = useState(ViewState.WALLET_INFO)
  const { theme } = useTheme()

  // Fetch balances using the hook we created
  const { balances, isLoading, totalBalanceUsd } = useAddressBalance(account, {
    includeSpam: false,
    onlyWithPrice: false,
  })
  const balanceDisplay = useMemo(() => {
    const display = formatAmount(totalBalanceUsd)?.split('.')
    return {
      integer: display?.[0] || '',
      decimal: display?.[1] || '',
    }
  }, [totalBalanceUsd])

  const noAssets = (balances.length === 0 || totalBalanceUsd === 0) && !isLoading
  const handleClick = useCallback((newIndex: number) => {
    setView(newIndex)
  }, [])

  const tokenFilterData = useMemo(() => {
    if (balances.length === 0) return []

    return balances.map((asset) => {
      return new Token(
        asset.chainId,
        asset.token.address as `0x${string}`,
        asset.token.decimals,
        asset.token.symbol,
        asset.token.name,
      )
    })
  }, [balances])

  return (
    <Box
      minWidth={isMobile ? '100%' : '357px'}
      maxHeight={isMobile ? 'auto' : 'calc(100vh - 80px)'}
      maxWidth={isMobile ? '100%' : '377px'}
      overflowY={isMobile ? undefined : 'auto'}
    >
      <FlexGap mb="10px" gap="8px" justifyContent="space-between" alignItems="center" paddingRight="16px" mt="8px">
        {viewState > ViewState.SEND_ASSETS && (
          <Button
            variant="tertiary"
            style={{ width: '34px', height: '34px', padding: '6px', borderRadius: '12px' }}
            onClick={() => {
              setViewState((prevState) => prevState - 1)
            }}
            ml={isMobile ? '8px' : '16px'}
          >
            <ArrowBackIcon fontSize="24px" color={theme.colors.primary60} />
          </Button>
        )}

        <CopyAddress tooltipMessage={t('Copied')} account={account || ''} />
        {viewState <= ViewState.SEND_ASSETS && (
          <FlexGap>
            <DisconnectButton scale="xs" onClick={onDisconnect}>
              {t('Disconnect')}
            </DisconnectButton>
          </FlexGap>
        )}
      </FlexGap>
      <Box padding={isMobile ? '0' : '0 16px 16px'}>
        {viewState >= ViewState.SEND_ASSETS ? (
          <SendAssets
            assets={balances}
            isLoading={isLoading}
            onViewStateChange={setViewState}
            viewState={viewState}
            onBack={() => setViewState((prevState) => ViewState.WALLET_INFO)}
          />
        ) : (
          <>
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
              <Box mt="16px">
                <Text fontSize="14px" color="textSubtle">
                  {t('Assets')}
                </Text>

                <AssetsList assets={balances} isLoading={isLoading} />
              </Box>
            ) : (
              !noAssets && (
                <Box padding="16px 0" maxHeight="280px" overflow="auto">
                  <RecentTransactions />
                </Box>
              )
            )}
          </>
        )}
      </Box>
      {viewState === ViewState.WALLET_INFO && (
        <>
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
                  onClick={() => {
                    setViewState(ViewState.SEND_ASSETS)
                  }}
                  variant="tertiary"
                >
                  {t('Send')}
                </ActionButton>
                <ActionButton
                  onClick={() => {
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
                {t('Bridge Crypto')}?
                <ArrowForwardIcon color="primary" />
              </Button>
            </ActionButtonsContainer>
          )}
        </>
      )}
    </Box>
  )
}

export default WalletModal
