import { Currency } from '@pancakeswap/sdk'
import { BottomDrawer, Box, Flex, useMatchBreakpoints } from '@pancakeswap/uikit'
import { useRouter } from 'next/router'
import { useContext, useEffect, useState } from 'react'

import { MobileCard } from 'components/AdPanel/MobileCard'
import { useCurrency } from 'hooks/Tokens'
import { AutoSlippageProvider } from 'hooks/useAutoSlippageWithFallback'
import { useSwapHotTokenDisplay } from 'hooks/useSwapHotTokenDisplay'
import { useSingleTokenSwapInfo } from 'quoter/hook/useSingleTokenSwapInfo'
import { QuoteProvider } from 'quoter/QuoteProvider'
import { Field } from 'state/swap/actions'
import { useSwapState } from 'state/swap/hooks'
import { styled } from 'styled-components'
import Page from '../Page'
import PriceChartContainer from '../Swap/components/Chart/PriceChartContainer'
import { StyledSwapContainer } from '../Swap/styles'
import { SwapFeaturesContext } from '../Swap/SwapFeaturesContext'
import { InfinitySwapForm } from './InfinitySwap'

const Wrapper = styled(Box)`
  width: 100%;
  ${({ theme }) => theme.mediaQueries.md} {
    min-width: 328px;
    max-width: 480px;
  }
`

const InfinitySwapInner = () => {
  const { query } = useRouter()
  const { isDesktop, isMobile } = useMatchBreakpoints()
  const {
    isChartExpanded,
    isChartDisplayed,
    setIsChartDisplayed,
    setIsChartExpanded,
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

  const singleTokenPrice = useSingleTokenSwapInfo({
    inputCurrencyId,
    inputCurrency: inputCurrency || undefined,
    outputCurrencyId,
    outputCurrency: outputCurrency || undefined,
  })

  return (
    <Page removePadding hideFooterOnDesktop={isChartExpanded || false} showExternalLink={false} showHelpLink={false}>
      <Flex
        width="100%"
        height="100%"
        justifyContent="center"
        position="relative"
        mt={isChartExpanded ? undefined : isMobile ? '18px' : '42px'}
        p={isChartExpanded ? undefined : isMobile ? '16px' : '24px'}
      >
        {isDesktop && isChartSupported && (
          <PriceChartContainer
            inputCurrencyId={inputCurrencyId}
            inputCurrency={currencies[Field.INPUT]}
            outputCurrencyId={outputCurrencyId}
            outputCurrency={currencies[Field.OUTPUT]}
            isChartExpanded={isChartExpanded}
            setIsChartExpanded={setIsChartExpanded}
            isChartDisplayed={isChartDisplayed}
            currentSwapPrice={singleTokenPrice}
          />
        )}
        {!isDesktop && isChartSupported && (
          <BottomDrawer
            content={
              <PriceChartContainer
                inputCurrencyId={inputCurrencyId}
                inputCurrency={currencies[Field.INPUT]}
                outputCurrencyId={outputCurrencyId}
                outputCurrency={currencies[Field.OUTPUT]}
                isChartExpanded={isChartExpanded}
                setIsChartExpanded={setIsChartExpanded}
                isChartDisplayed={isChartDisplayed}
                currentSwapPrice={singleTokenPrice}
                isFullWidthContainer
                isMobile
              />
            }
            isOpen={isChartDisplayed}
            setIsOpen={(isOpen) => setIsChartDisplayed?.(isOpen)}
          />
        )}
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
            <AutoSlippageProvider>
              <Wrapper height="100%">
                <InfinitySwapForm />
              </Wrapper>
            </AutoSlippageProvider>
          </StyledSwapContainer>
        </Flex>
      </Flex>

      <MobileCard />
    </Page>
  )
}

export default function InfinitySwap() {
  return (
    <QuoteProvider>
      <InfinitySwapInner />
    </QuoteProvider>
  )
}
