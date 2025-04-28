import { Box, Skeleton } from '@pancakeswap/uikit'
import dynamic from 'next/dynamic'
import styled from 'styled-components'
import { CHAIN_IDS } from 'utils/wagmi'
import SwapLayout from 'views/Swap/SwapLayout'

const StyledSkeleton = styled(Skeleton)`
  background: ${({ theme }) => theme.colors.gradientBubblegum};
  opacity: 0.1;
`
const BgBox = styled(Box)`
  background: ${({ theme }) => theme.colors.gradientBubblegum};
`
const Swap = dynamic(() => import('views/SwapSimplify'), {
  ssr: false,
  loading: () => (
    <BgBox
      style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <StyledSkeleton
        variant="rect"
        animation="waves"
        style={{
          minHeight: '100vh',
        }}
      />
    </BgBox>
  ),
})

const SwapPage = () => (
  <SwapLayout>
    <Swap />
  </SwapLayout>
)

SwapPage.chains = CHAIN_IDS
SwapPage.screen = true

export default SwapPage
