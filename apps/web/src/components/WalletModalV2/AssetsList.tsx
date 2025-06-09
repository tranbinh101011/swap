import { ChainId, getChainName } from '@pancakeswap/chains'
import { useTranslation } from '@pancakeswap/localization'
import { Token } from '@pancakeswap/sdk'
import { Box, FlexGap, Skeleton, Text } from '@pancakeswap/uikit'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import { ASSET_CDN } from 'config/constants/endpoints'
import { BalanceData } from 'hooks/useAddressBalance'
import React from 'react'
import styled from 'styled-components'
import { formatAmount } from 'utils/formatInfoNumbers'

const SCROLLBAR_SHIFT_PX = 8

const AssetListContainer = styled(Box)`
  max-height: 280px;
  overflow-y: auto;
  padding: 0;
  width: calc(100% + ${SCROLLBAR_SHIFT_PX}px);
  margin-right: -${SCROLLBAR_SHIFT_PX}px;
  padding-right: ${SCROLLBAR_SHIFT_PX}px;
  min-height: 250px;
  ${({ theme }) => theme.mediaQueries.md} {
    max-height: 340px;
    min-height: 300px;
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

interface AssetsListProps {
  assets: BalanceData[]
  isLoading: boolean
  onRowClick?: (asset: BalanceData) => void
}

export const AssetsList: React.FC<AssetsListProps> = ({ assets, isLoading, onRowClick }) => {
  const { t } = useTranslation()

  return (
    <AssetListContainer>
      {isLoading ? (
        <FlexGap justifyContent="center" padding="4px" flexDirection="column" gap="8px">
          <Skeleton height="55px" width="100%" />
          <Skeleton height="55px" width="100%" />
          <Skeleton height="55px" width="100%" />
          <Skeleton height="55px" width="100%" />
          <Skeleton height="55px" width="100%" />
          <Skeleton height="55px" width="100%" />
        </FlexGap>
      ) : assets.length === 0 ? null : (
        assets.map((asset) => {
          const token = new Token(
            asset.chainId,
            asset.token.address as `0x${string}`,
            asset.token.decimals,
            asset.token.symbol,
            asset.token.name,
          )
          const chainName = asset.chainId === ChainId.BSC ? 'BNB' : getChainName(asset.chainId)
          return (
            <AssetItem key={asset.id} onClick={onRowClick ? () => onRowClick(asset) : undefined}>
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
    </AssetListContainer>
  )
}

export default AssetsList
