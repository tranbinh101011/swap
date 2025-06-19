import { GetStaticPaths, GetStaticProps } from 'next'
import dynamic from 'next/dynamic'
import { CHAIN_IDS } from 'utils/wagmi'

const RemoveLiquidityView = dynamic(
  () => import('views/Liquidity/RemoveLiquidityView').then((mod) => mod.RemoveLiquidityView),
  {
    ssr: false,
  },
)
const RemoveLiquidityPage = () => {
  return <RemoveLiquidityView />
}

RemoveLiquidityPage.chains = CHAIN_IDS
RemoveLiquidityPage.screen = true

export default RemoveLiquidityPage

export const getStaticPaths: GetStaticPaths = () => {
  return {
    paths: [],
    fallback: true,
  }
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const tokenId = params?.tokenId

  const isNumberReg = /^\d+$/

  if (!(tokenId as string)?.match(isNumberReg)) {
    return {
      redirect: {
        statusCode: 307,
        destination: `/add`,
      },
    }
  }

  return {
    props: {},
  }
}
