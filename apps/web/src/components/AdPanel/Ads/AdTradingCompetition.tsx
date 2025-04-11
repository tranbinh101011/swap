import { useTranslation } from '@pancakeswap/localization'
import { Link, useMatchBreakpoints } from '@pancakeswap/uikit'
import { useMemo } from 'react'
import { BodyText } from '../BodyText'
import { AdButton } from '../Button'
import { AdCard } from '../Card'

import { AdPlayerProps } from '../types'
import { getImageUrl } from '../utils'

const tradingCompetitionConfig = {
  merl: {
    imgUrl: 'merl_competition',
    swapUrl:
      'https://pancakeswap.finance/swap?inputCurrency=BNB&outputCurrency=0xa0c56a8c0692bD10B3fA8f8bA79Cf5332B7107F9&utm_source=Website&utm_medium=banner&utm_campaign=MERL&utm_id=TradingCompetition',
    learnMoreUrl:
      'https://blog.pancakeswap.finance/articles/pancake-swap-x-merl-trading-competition-50-000-in-rewards?utm_source=Website&utm_medium=banner&utm_campaign=MERL&utm_id=TradingCompetition',
    reward: '50,000',
    unit: '$',
  },
}

export const AdTradingCompetition = (props: AdPlayerProps & { token: keyof typeof tradingCompetitionConfig }) => {
  const { t } = useTranslation()
  const { isMobile } = useMatchBreakpoints()
  const { token, ...rest } = props
  const { unit, reward, imgUrl, swapUrl, learnMoreUrl } = tradingCompetitionConfig[token]

  return (
    <AdCard imageUrl={getImageUrl(imgUrl)} {...rest}>
      <BodyText mb="0">
        {isMobile
          ? t('Swap %token% to win a share of', { token: token.toUpperCase() })
          : t('Join %token% Trading Competition to share of', { token: token.toUpperCase() })}{' '}
        {unit === '$' ? `$${reward}` : `${reward} ${unit}`}.{' '}
        <Link style={!isMobile ? { display: 'inline' } : {}} fontSize="inherit" href={swapUrl} color="secondary" bold>
          {t('Swap Now')}
        </Link>
      </BodyText>
      <AdButton mt="16px" href={learnMoreUrl} externalIcon isExternalLink>
        {t('Learn More')}
      </AdButton>
    </AdCard>
  )
}

export const useTradingCompetitionAds = () => {
  return useMemo(
    () =>
      Object.keys(tradingCompetitionConfig)
        .reverse()
        .map((token) => ({
          id: `ad-${token}-tc`,
          component: <AdTradingCompetition key={token} token={token as keyof typeof tradingCompetitionConfig} />,
        })),
    [],
  )
}
