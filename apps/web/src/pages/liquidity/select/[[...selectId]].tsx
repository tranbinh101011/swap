import { useTranslation } from '@pancakeswap/localization'
import { Breadcrumbs, Container } from '@pancakeswap/uikit'
import PageLoader from 'components/Loader/PageLoader'
import { SelectIdRoute } from 'dynamicRoute'
import { useDefaultSelectIdRoute, useSelectIdRoute } from 'hooks/dynamicRoute/useSelectIdRoute'
import NextLink from 'next/link'
import { CHAIN_IDS } from 'utils/wagmi'
import { AddLiquiditySelector } from 'views/AddLiquiditySelector'

export type RouteType = typeof SelectIdRoute

const LiquiditySelectPage = () => {
  const { routeParams } = useSelectIdRoute()
  const { t } = useTranslation()
  useDefaultSelectIdRoute()

  if (!routeParams) {
    return <PageLoader />
  }

  return (
    <Container mx="auto" my="24px" maxWidth="1200px" minHeight="calc(100vh - 200px)">
      <Breadcrumbs>
        <NextLink href="/liquidity/pools">{t('Farms')}</NextLink>
        <NextLink href="#">{t('Add Liquidity')}</NextLink>
      </Breadcrumbs>
      <AddLiquiditySelector />
    </Container>
  )
}

LiquiditySelectPage.screen = true
LiquiditySelectPage.chains = CHAIN_IDS

export default LiquiditySelectPage
