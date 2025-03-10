import { useMatchBreakpoints } from '@pancakeswap/uikit'
import { atom, useAtomValue } from 'jotai'
import { useMemo } from 'react'
import { AdsIds, useAdsConfigs } from 'components/AdPanel/hooks/useAdsConfig'
import { AdCakeStaking } from './Ads/AdCakeStaking'
import { AdIfo } from './Ads/AdIfo'
import { AdPCSX } from './Ads/AdPCSX'
import { AdPicks } from './Ads/AdPicks'
import { AdSpringboard } from './Ads/AdSpringboard'
import { ExpandableAd } from './Expandable/ExpandableAd'
import { shouldRenderOnPages } from './renderConditions'
import { AdSlide, PicksConfig } from './types'
import { useShouldRenderAdIfo } from './useShouldRenderAdIfo'
import { AdCommon } from './Ads/AdCommon'

enum Priority {
  FIRST_AD = 6,
  VERY_HIGH = 5,
  HIGH = 4,
  MEDIUM = 3,
  LOW = 2,
  VERY_LOW = 1,
}

const picksConfigAtom = atom(async () => {
  const time = Math.floor((Date.now() / 1000) * 60 * 5) // Cache 5min

  const urlPreview = `https://proofs.pancakeswap.com/picks/today-preview.json?t=${time}`
  const isPreview = window.location.origin !== 'https://pancakeswap.finance'
  const url = isPreview ? urlPreview : `https://proofs.pancakeswap.com/picks/today.json?t=${time}`
  try {
    const response = await fetch(url)
    const json = await response.json()
    return json as PicksConfig
  } catch (ex) {
    return null
  }
})
export const usePicksConfig = () => {
  const picksConfig = useAtomValue(picksConfigAtom)

  if (!picksConfig) {
    return []
  }

  const adList: AdSlide[] = picksConfig.configs.map((config, i) => {
    return {
      id: `pick-${config.poolId}`,
      component: <AdPicks config={config} index={i} />,
    }
  })
  return adList
}

export const useAdConfig = () => {
  const { isDesktop } = useMatchBreakpoints()
  const shouldRenderOnPage = shouldRenderOnPages(['/buy-crypto', '/', '/prediction'])
  const MAX_ADS = isDesktop ? 6 : 4
  const shouldRenderAdIfo = useShouldRenderAdIfo()
  const configs = useAdsConfigs()
  const commonAdConfigs = useMemo(() => {
    return Object.entries(configs)
      .map(([key, value]) => {
        if (value.ad) {
          return {
            id: value.id,
            component: <AdCommon id={key as AdsIds} />,
          }
        }
        return undefined
      })
      .filter(Boolean) as { id: string; component: JSX.Element }[]
  }, [configs])

  const adList: Array<AdSlide> = useMemo(
    () => [
      {
        id: 'expandable-ad',
        component: <ExpandableAd />,
        priority: Priority.FIRST_AD,
        shouldRender: [shouldRenderOnPage],
      },
      ...commonAdConfigs,
      {
        id: 'ad-springboard',
        component: <AdSpringboard />,
      },
      {
        id: 'ad-ifo',
        component: <AdIfo />,
        shouldRender: [shouldRenderAdIfo],
      },
      {
        id: 'pcsx',
        component: <AdPCSX />,
      },
      {
        id: 'cake-staking',
        component: <AdCakeStaking />,
      },
    ],
    [shouldRenderOnPage, shouldRenderAdIfo, commonAdConfigs],
  )

  return useMemo(
    () =>
      adList
        .filter((ad) => ad.shouldRender === undefined || ad.shouldRender.every(Boolean))
        .sort((a, b) => (b.priority || Priority.VERY_LOW) - (a.priority || Priority.VERY_LOW))
        .slice(0, MAX_ADS),
    [adList, MAX_ADS],
  )
}

// Array of strings or regex patterns
const commonLayoutAdIgnoredPages = [
  '/home',
  '/cake-staking',
  // Route matching: /liquidity/pool/<chainName>/<poolAddress>
  /\/liquidity\/pool\/\w+\/\w+/,
]

/**
 *  On the pages mentioned, the Mobile ads will be placed directly in page instead of in the app layout.
 *  So don't render in the app layout.
 *  Contains strings or regex patterns.
 */
export const layoutMobileAdIgnoredPages = [
  ...commonLayoutAdIgnoredPages,
  '/',
  '/prediction',
  '/liquidity/pools',
  '/migration/bcake',
]

/**
 *  On the pages mentioned, the Desktop ads will be placed directly in page instead of in the app layout.
 *  So don't render in the app layout.
 *  Contains strings or regex patterns.
 */
export const layoutDesktopAdIgnoredPages = [...commonLayoutAdIgnoredPages]

// NOTE: In current phase, we're adding pages to whitelist as well for AdPlayer.
export const commonLayoutWhitelistedPages = ['/', '/buy-crypto', '/prediction']
