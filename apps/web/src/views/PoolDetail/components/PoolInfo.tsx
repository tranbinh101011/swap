import { useTranslation } from '@pancakeswap/localization'
import { Percent, Token } from '@pancakeswap/swap-sdk-core'
import { AutoColumn, AutoRow, Box, Flex, FlexGap, Grid, Spinner, Text, useMatchBreakpoints } from '@pancakeswap/uikit'
import { ChainLogo, DoubleCurrencyLogo, FeeTierTooltip, Liquidity } from '@pancakeswap/widgets-internal'
import { InfinityFeeTierBreakdown } from 'components/FeeTierBreakdown'
import { PoolFeatures } from 'components/PoolFeatures/PoolFeatures'
import { useHookByPoolId } from 'hooks/infinity/useHooksList'
import { useCurrencyByChainId } from 'hooks/Tokens'
import useAccountActiveChain from 'hooks/useAccountActiveChain'
import { NextSeo } from 'next-seo'
import { useMemo } from 'react'
import { InfinityPoolInfo } from 'state/farmsV4/state/type'
import { useChainIdByQuery, useChainNameByQuery } from 'state/info/hooks'
import styled from 'styled-components'
import { multiChainNameConverter } from 'utils/chainNameConverter'
import { isInfinityProtocol } from 'utils/protocols'
import { zeroAddress } from 'viem'
import { PoolGlobalAprButton } from 'views/universalFarms/components/PoolAprButton'
import { usePoolInfoByQuery } from '../hooks/usePoolInfo'
import { MyPositions } from './MyPositions'
import { PoolCharts } from './PoolCharts'
import { PoolCurrencies } from './PoolCurrencies'
import { PoolStatus } from './PoolStatus'
import { PoolTvlWarning } from './PoolTvlWarning'
import { Transactions } from './Transactions/Transactions'

const Header = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 24px;
`

export const PoolInfo = () => {
  const { t } = useTranslation()
  const poolInfo = usePoolInfoByQuery()
  const chainId = useChainIdByQuery()
  const networkName = useChainNameByQuery()
  const currency0 =
    useCurrencyByChainId(poolInfo?.token0.isNative ? zeroAddress : (poolInfo?.token0 as Token)?.address, chainId) ??
    undefined
  const currency1 = useCurrencyByChainId(poolInfo?.token1.address, chainId) ?? undefined
  const fee = useMemo(() => {
    return new Percent(poolInfo?.feeTier ?? 0n, poolInfo?.feeTierBase)
  }, [poolInfo?.feeTier, poolInfo?.feeTierBase])
  const { account } = useAccountActiveChain()
  const poolId = (poolInfo as InfinityPoolInfo)?.poolId
  const hookData = useHookByPoolId(chainId, poolId)
  const { isMobile } = useMatchBreakpoints()

  if (!poolInfo)
    return (
      <Flex mt="80px" justifyContent="center">
        <Spinner />
      </Flex>
    )

  return (
    <AutoColumn gap={['16px', null, null, '48px']}>
      <NextSeo title={`${currency0?.symbol} / ${currency1?.symbol}`} />
      <Header>
        <Flex alignItems={isMobile ? 'flex-start' : 'center'} flexDirection={isMobile ? 'column' : 'row'}>
          <Box mr="12px">
            <DoubleCurrencyLogo currency0={currency0} currency1={currency1} size={48} innerMargin="-8px" />
          </Box>
          <FlexGap gap="4px">
            <Text bold fontSize={40}>
              {currency0?.isNative ? currency0?.symbol : currency0?.wrapped.symbol}
            </Text>
            <Text color="textSubtle" bold fontSize={40}>
              /
            </Text>
            <Text bold fontSize={40}>
              {currency1?.symbol}
            </Text>
          </FlexGap>
        </Flex>
        <FlexGap gap="16px" flexWrap="wrap" alignItems="center" alignContent="center">
          {poolInfo?.protocol ? (
            <AutoColumn rowGap="4px">
              <Text fontSize={12} bold color="textSubtle" textTransform="uppercase">
                {t('fee tier')}
              </Text>
              <Box>
                {isInfinityProtocol(poolInfo.protocol) ? (
                  <InfinityFeeTierBreakdown poolId={poolId} chainId={chainId} />
                ) : (
                  <FeeTierTooltip type={poolInfo.protocol} percent={fee} dynamic={poolInfo?.isDynamicFee} />
                )}
              </Box>
            </AutoColumn>
          ) : null}
          <AutoColumn rowGap="4px">
            <Text fontSize={12} bold color="textSubtle" textTransform="uppercase">
              {t('network')}
            </Text>
            <FlexGap gap="4px">
              <ChainLogo chainId={chainId} />
              <Text fontSize={12} bold color="textSubtle" lineHeight="24px">
                {multiChainNameConverter(networkName)}
              </Text>
            </FlexGap>
          </AutoColumn>
          <AutoColumn rowGap="4px">
            <Text fontSize={12} bold color="textSubtle" textTransform="uppercase">
              {t('apr')}
            </Text>
            {poolInfo ? <PoolGlobalAprButton pool={poolInfo} /> : null}
          </AutoColumn>
          <Liquidity.PoolFeaturesBadge
            showPoolType
            poolType={poolInfo.protocol}
            hookData={hookData}
            labelTextProps={{ bold: true }}
          />
        </FlexGap>
      </Header>

      {poolInfo ? <MyPositions poolInfo={poolInfo} /> : null}

      {hookData && (
        <AutoColumn gap="lg">
          <Text as="h3" fontWeight={600} fontSize={24}>
            {t('Pool Features (Hooks)')}
          </Text>
          <PoolFeatures hookData={hookData} />
        </AutoColumn>
      )}

      <AutoColumn gap="lg">
        <AutoRow gap="lg" flexWrap="wrap">
          <Text as="h3" fontWeight={600} fontSize={24}>
            {t('Pair info')}
          </Text>
          <PoolCurrencies poolInfo={poolInfo} />
        </AutoRow>

        <PoolTvlWarning poolInfo={poolInfo} />
        <Grid gridGap="24px" gridTemplateColumns={['1fr', '1fr', '1fr', '1fr 2fr']}>
          <PoolStatus poolInfo={poolInfo} />
          <PoolCharts poolInfo={poolInfo} />
        </Grid>
      </AutoColumn>

      <Transactions protocol={poolInfo?.protocol} />
    </AutoColumn>
  )
}
