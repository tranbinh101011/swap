import { AdSlide, Priority } from '@pancakeswap/widgets-internal'
import { AdPCSxSolana } from './ads/AdPCSxSolana'

export const adList: Array<AdSlide> = [
  {
    id: 'expandable-ad',
    component: <AdPCSxSolana />,
    priority: Priority.FIRST_AD,
  },
]

export const commonLayoutWhitelistedPages = ['/swap']
