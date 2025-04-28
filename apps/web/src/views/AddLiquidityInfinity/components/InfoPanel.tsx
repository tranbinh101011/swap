import { Protocol } from '@pancakeswap/farms'
import { useTranslation } from '@pancakeswap/localization'
import { Card, CardBody, Flex, FlexGap, PreTitle, Text } from '@pancakeswap/uikit'
import { ChainLogo, Liquidity } from '@pancakeswap/widgets-internal'
import Divider from 'components/Divider'
import { InfinityFeeTierBreakdown } from 'components/FeeTierBreakdown'
import { GreyBadge } from 'components/Liquidity/Badges'
import { DoubleCurrencyLogoV2 } from 'components/Logo'
import { useCurrencyByPoolId } from 'hooks/infinity/useCurrencyByPoolId'
import { useHookByPoolId } from 'hooks/infinity/useHooksList'
import { usePoolInfo } from 'state/farmsV4/hooks'
import { useInverted } from 'state/infinity/shared'
import styled from 'styled-components'
import { chainNameConverter } from 'utils/chainNameConverter'
import { getCurrencyAddress } from 'utils/getCurrencyAddress'
import { Address } from 'viem'
import { InfinityBinPoolDerivedAprButton, InfinityCLPoolDerivedAprButton } from 'views/universalFarms/components'
import { getChainFullName } from 'views/universalFarms/utils'
import { FieldAddDepositAmount } from './FieldAddDepositAmount'

const StyledCard = styled(Card)`
  width: 100%;
`

const InfoWrapper = styled(Flex)`
  display: flex;

  flex-direction: column;
  gap: 8px;
`

const InfoRow = styled(Flex)`
  justify-content: space-between;
  align-items: flex-start;
`

const InfoTitle = styled(Text)`
  color: ${({ theme }) => theme.colors.textSubtle};
  font-size: 14px;
`

interface InfoPanelProps {
  poolId?: Address
  chainId?: number
}

export const InfoPanel = ({ poolId, chainId }: InfoPanelProps) => {
  const { t } = useTranslation()

  const { currency0, currency1 } = useCurrencyByPoolId({ chainId, poolId })
  const [inverted] = useInverted()
  const hookData = useHookByPoolId(chainId, poolId)
  const poolInfo = usePoolInfo({ poolAddress: poolId, chainId })
  const chainName = chainId ? getChainFullName(chainId) : ''

  return (
    <StyledCard style={{ overflow: 'visible' }}>
      <CardBody>
        <FlexGap flexDirection="column" gap="8px">
          <FlexGap gap="4px" width="fit-content" alignItems="center">
            <Flex flexDirection="column">
              <Flex alignItems="center">
                <DoubleCurrencyLogoV2
                  address0={getCurrencyAddress(currency0)}
                  address1={getCurrencyAddress(currency1)}
                  size={32}
                  variant="farm"
                />
                <FlexGap flexDirection="column" ml="38px">
                  <Text fontSize="24px" bold>
                    {currency0?.symbol}
                    <Text as="span" mx="1px" fontSize="24px" color="gray" bold>
                      /
                    </Text>
                    {currency1?.symbol}
                  </Text>
                  <FlexGap gap="3px" alignItems="center">
                    <ChainLogo chainId={Number(chainId)} width={18} mt="2px" />
                    <Text color="textSubtle" textTransform="uppercase" fontSize={12} bold>
                      {chainName ? chainNameConverter(chainName) : null}
                    </Text>
                  </FlexGap>
                </FlexGap>
              </Flex>
            </Flex>
          </FlexGap>
          <Divider thin />
          <PreTitle>{t('Overview')}</PreTitle>
          <InfoWrapper>
            <InfoRow>
              <InfoTitle>{t('APR')}</InfoTitle>
              {poolInfo ? (
                poolInfo.protocol === Protocol.InfinityCLAMM ? (
                  <InfinityCLPoolDerivedAprButton pool={poolInfo} />
                ) : poolInfo.protocol === Protocol.InfinityBIN ? (
                  <InfinityBinPoolDerivedAprButton pool={poolInfo} />
                ) : (
                  '-'
                )
              ) : null}
            </InfoRow>
            <InfoRow>
              <InfoTitle>{t('Fee tier')}</InfoTitle>
              <GreyBadge mt="2px" px={0}>
                <Text color="textSubtle" small>
                  <InfinityFeeTierBreakdown poolId={poolId} chainId={chainId} />
                </Text>
              </GreyBadge>
            </InfoRow>
            <Liquidity.PoolFeaturesBadge
              hookData={hookData}
              layout="row"
              poolType={poolInfo?.protocol}
              labelTextProps={{ fontSize: '14px', textTransform: 'capitalize' }}
              showPoolFeatureInfo
              showPoolTypeInfo
            />
          </InfoWrapper>
          <Divider thin />
          <FieldAddDepositAmount
            baseCurrency={inverted ? currency1 : currency0}
            quoteCurrency={inverted ? currency0 : currency1}
          />
        </FlexGap>
      </CardBody>
    </StyledCard>
  )
}
