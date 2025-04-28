import type { GetStaticPaths, GetStaticProps } from 'next'
import { getTokenStaticPaths, getTokenStaticProps } from 'utils/pageUtils'
import { InfoPageLayout } from 'views/InfinityInfo/components/Layout'
import TokenInfo from 'views/InfinityInfo/components/Tokens/TokenInfo'

const TokenPage = ({ address }: { address: string }) => {
  if (!address) {
    return null
  }

  return <TokenInfo address={address.toLowerCase()} />
}

TokenPage.Layout = InfoPageLayout
TokenPage.chains = [] // set all

export default TokenPage

export const getStaticPaths: GetStaticPaths = getTokenStaticPaths()

export const getStaticProps: GetStaticProps = getTokenStaticProps()
