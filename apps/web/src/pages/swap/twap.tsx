import dynamic from 'next/dynamic'
import { NextPageWithLayout } from 'utils/page.types'
import { CHAIN_IDS } from 'utils/wagmi'
import Page from 'views/Page'
import SwapLayout from 'views/Swap/SwapLayout'
import TwapAndLimitSwap from 'views/Swap/Twap/TwapSwap'

const Layout: React.FC<React.PropsWithChildren> = ({ children }) => {
  return (
    <Page showExternalLink={false} showHelpLink={false}>
      {children}
    </Page>
  )
}

// const TwapAndLimitSwap = dynamic(() => import('views/Swap/Twap/TwapSwap'), { ssr: false })

const TwapView = () => (
  <SwapLayout>
    <TwapAndLimitSwap />
  </SwapLayout>
)

const TwapPage = dynamic(() => Promise.resolve(TwapView), {
  ssr: false,
}) as NextPageWithLayout

TwapPage.chains = CHAIN_IDS
TwapPage.screen = true
TwapPage.Layout = Layout

export default TwapPage
