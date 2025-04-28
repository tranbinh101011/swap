import { INFINITY_SUPPORTED_CHAINS } from '@pancakeswap/infinity-sdk'
import { InfoPageLayout } from 'views/InfinityInfo/components/Layout'
import Overview from 'views/Info/Overview'

const InfoPage = () => {
  return <Overview />
}

InfoPage.Layout = InfoPageLayout
InfoPage.chains = INFINITY_SUPPORTED_CHAINS

export default InfoPage
