import { Box, Skeleton, useMatchBreakpoints } from '@pancakeswap/uikit'
import dynamic from 'next/dynamic'
import styled from 'styled-components'
import { CHAIN_IDS } from 'utils/wagmi'
import SwapLayout from 'views/Swap/SwapLayout'

const StyledSkeleton = styled(Skeleton)`
  background: ${({ theme }) => theme.colors.backgroundBubblegum};
  opacity: 0.1;
`
const BgBox = styled(Box)`
  background: ${({ theme }) => theme.colors.backgroundBubblegum};
`
const Container = styled.div<{ isMobile: boolean }>`
  min-height: ${({ isMobile }) => (isMobile ? '100vh' : '100%')};
  background: ${({ theme }) => theme.colors.backgroundBubblegum};
`
const SwapFallback = () => {
  const { isMobile } = useMatchBreakpoints()

  return (
    <BgBox
      style={{
        minHeight: isMobile ? '100vh' : '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <StyledSkeleton
        variant="rect"
        animation="waves"
        style={{
          minHeight: isMobile ? '100vh' : '100%',
        }}
      />
    </BgBox>
  )
}
const Swap = dynamic(() => import('views/SwapSimplify'), {
  ssr: false,
  loading: () => <SwapFallback />,
})

const SwapPage = () => {
  const { isMobile } = useMatchBreakpoints()

  return (
    <SwapLayout>
      <Container isMobile={isMobile}>
        <Swap />
      </Container>
    </SwapLayout>
  )
}

SwapPage.chains = CHAIN_IDS
SwapPage.screen = true

export default SwapPage
