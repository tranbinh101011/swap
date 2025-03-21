import { Currency } from '@pancakeswap/sdk'
import { Box, Flex, useMatchBreakpoints } from '@pancakeswap/uikit'
import { useRouter } from 'next/router'
import { useContext, useEffect, useState } from 'react'

import { useCurrency } from 'hooks/Tokens'
import { useSwapHotTokenDisplay } from 'hooks/useSwapHotTokenDisplay'
import { Field } from 'state/swap/actions'
import { useSwapState } from 'state/swap/hooks'
import { styled } from 'styled-components'
import { StyledSwapContainer } from '../Swap/styles'
import { SwapFeaturesContext } from '../Swap/SwapFeaturesContext'
import { V4SwapFormForHomePage } from './V4Swap/V4SwapFormForHomepage'

const Wrapper = styled(Box)`
  width: 100%;
  ${({ theme }) => theme.mediaQueries.md} {
    min-width: 328px;
    max-width: 480px;
  }
`

export default function SimpleSwapForHomePage() {
  const { query } = useRouter()
  const { isDesktop, isMobile } = useMatchBreakpoints()
  const {
    isChartExpanded,
    isChartDisplayed,
    setIsChartDisplayed,
    isChartSupported,
    // isHotTokenSupported,
  } = useContext(SwapFeaturesContext)
  const [isSwapHotTokenDisplay, setIsSwapHotTokenDisplay] = useSwapHotTokenDisplay()
  // const { t } = useTranslation()
  const [firstTime, setFirstTime] = useState(true)

  useEffect(() => {
    if (firstTime && query.showTradingReward) {
      setFirstTime(false)
      setIsSwapHotTokenDisplay(true)

      if (!isSwapHotTokenDisplay && isChartDisplayed) {
        setIsChartDisplayed?.((currentIsChartDisplayed) => !currentIsChartDisplayed)
      }
    }
  }, [firstTime, isChartDisplayed, isSwapHotTokenDisplay, query, setIsSwapHotTokenDisplay, setIsChartDisplayed])

  // swap state & price data
  const {
    [Field.INPUT]: { currencyId: inputCurrencyId },
    [Field.OUTPUT]: { currencyId: outputCurrencyId },
  } = useSwapState()
  const inputCurrency = useCurrency(inputCurrencyId)
  const outputCurrency = useCurrency(outputCurrencyId)

  const currencies: { [field in Field]?: Currency } = {
    [Field.INPUT]: inputCurrency ?? undefined,
    [Field.OUTPUT]: outputCurrency ?? undefined,
  }

  return (
    <Flex
      width="100%"
      height="100%"
      justifyContent="center"
      position="relative"
      mt={isChartExpanded ? undefined : isMobile ? '0px' : '-2px'}
      p={isChartExpanded ? undefined : isMobile ? '16px' : '24px'}
    >
      <Flex
        flexDirection="column"
        alignItems="center"
        height="100%"
        width={isChartDisplayed && !isMobile ? 'auto' : '100%'}
        mt={isChartExpanded && !isMobile ? '42px' : undefined}
        position="relative"
        zIndex={1}
      >
        <StyledSwapContainer
          justifyContent="center"
          width="100%"
          style={{ height: '100%' }}
          $isChartExpanded={isChartExpanded}
        >
          <Wrapper height="100%">
            <V4SwapFormForHomePage />
          </Wrapper>
        </StyledSwapContainer>
      </Flex>
    </Flex>
  )
}
