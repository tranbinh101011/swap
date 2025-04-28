import { INFINITY_SUPPORTED_CHAINS } from '@pancakeswap/infinity-sdk'
import { InfoPageLayout } from 'views/InfinityInfo/components/Layout'
import Pools from 'views/InfinityInfo/components/Pools'

const InfoPage = () => {
  return <Pools />
}

InfoPage.Layout = InfoPageLayout
InfoPage.chains = INFINITY_SUPPORTED_CHAINS

export default InfoPage
