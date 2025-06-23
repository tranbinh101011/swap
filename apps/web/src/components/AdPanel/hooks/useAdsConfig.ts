import { ContextApi, useTranslation } from '@pancakeswap/localization'
import { useMemo } from 'react'
import { useMatchBreakpoints } from '@pancakeswap/uikit'
import { AdsCampaignConfig } from '../types'

export enum AdsIds {
  BINANCE_ALPHA = 'binance-alpha',
}

type AdsConfigMap = {
  [key in AdsIds]: AdsCampaignConfig
}
const getAdsConfigs = (t: ContextApi['t'], isMobile: boolean): AdsCampaignConfig[] => {
  return [
    {
      id: AdsIds.BINANCE_ALPHA,
      ad: {
        img: !isMobile ? 'alpha-comp' : 'alpha-comp-mobile',
        texts: [
          {
            text: !isMobile ? t('Trade Binance Alpha Tokens to Win $250,000.') : t('Trade Alpha Tokens: Win $250K.'),
          },
          {
            text: t('Trade Now'),
            link: 'https://pancakeswap.finance/swap?utm_source=Website&utm_medium=banner&utm_campaign=AlphaTokens&utm_id=TradingCompetition',
          },
        ],
        btn: {
          text: t('Learn More'),
          link: 'https://blog.pancakeswap.finance/articles/binance-alpha-trading-competition',
        },
        options: {
          imagePadding: '20px',
        },
      },
    },
  ]
}

export const useAdsConfigs = (): AdsConfigMap => {
  const { t } = useTranslation()
  const { isMobile } = useMatchBreakpoints()

  const AdsConfigs: AdsConfigMap = useMemo(
    () =>
      getAdsConfigs(t, isMobile).reduce((acc, config) => {
        // eslint-disable-next-line no-param-reassign
        acc[config.id] = config
        return acc
      }, {} as AdsConfigMap),
    [t, isMobile],
  )

  return AdsConfigs
}

export const useAdsConfig = (id: AdsIds) => {
  const configs = useAdsConfigs()
  return configs[id]
}
