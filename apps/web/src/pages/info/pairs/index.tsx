import { InfoPageLayout } from 'views/Info'
import Pools from 'views/Info/Pools'

const InfoPoolsPage = () => {
  return <Pools />
}

InfoPoolsPage.Layout = InfoPageLayout
InfoPoolsPage.chains = [] // set all

export default InfoPoolsPage
