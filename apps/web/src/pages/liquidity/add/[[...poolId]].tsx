import { useTranslation } from '@pancakeswap/localization'
import { Breadcrumbs, Container, FlexGap, Text, useMatchBreakpoints } from '@pancakeswap/uikit'
import PageLoader from 'components/Loader/PageLoader'
import GlobalSettings from 'components/Menu/GlobalSettings'
import { SettingsMode } from 'components/Menu/GlobalSettings/types'
import { PoolIdRoute } from 'dynamicRoute'
import { usePoolIdRoute } from 'hooks/dynamicRoute/usePoolIdRoute'
import dynamic from 'next/dynamic'
import { NextPageWithLayout } from 'utils/page.types'
import NextLink from 'next/link'
import NotFoundPage from 'pages/404'
import { CHAIN_IDS } from 'utils/wagmi'
import { AddLiquidityInfinityForm } from 'views/AddLiquidityInfinity'

export type RouteType = typeof PoolIdRoute

const AddLiquiditySelectorPage = () => {
  const { t } = useTranslation()
  const { routeParams, routeError } = usePoolIdRoute()
  const { isLg } = useMatchBreakpoints()

  if (routeError) {
    console.warn('AddLiquiditySelectorPage routeError', { routeError })
    return <NotFoundPage />
  }

  if (!routeParams) {
    return <PageLoader />
  }

  return (
    <Container mx="auto" my="24px" maxWidth="1200px">
      <Breadcrumbs>
        <NextLink href="/liquidity/pools">{t('Farms')}</NextLink>
        <NextLink href="#">{t('Add Liquidity')}</NextLink>
      </Breadcrumbs>
      <FlexGap flexDirection="column" gap={isLg ? '24px' : '16px'} mt={['16px', '24px', '24px', '40px']}>
        <FlexGap alignItems="center" gap="8px">
          <Text as="h1" fontSize={24} bold mb="0">
            {t('Add liquidity')}
          </Text>
          <GlobalSettings mode={SettingsMode.SWAP_LIQUIDITY} />
        </FlexGap>
        <AddLiquidityInfinityForm />
      </FlexGap>
    </Container>
  )
}

const Page = dynamic(() => Promise.resolve(AddLiquiditySelectorPage), {
  ssr: false,
}) as NextPageWithLayout

Page.screen = true
Page.chains = CHAIN_IDS

export default Page
