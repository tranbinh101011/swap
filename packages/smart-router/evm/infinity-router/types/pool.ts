import type { BigintIsh, Currency } from '@pancakeswap/swap-sdk-core'

import type { OnChainProvider } from '../../v3-router/types'

type WithMulticallGasLimit = {
  gasLimit?: BigintIsh
}

type WithClientProvider = {
  clientProvider?: OnChainProvider
}

export type GetInfinityCandidatePoolsParams = {
  currencyA?: Currency
  currencyB?: Currency
} & WithClientProvider &
  WithMulticallGasLimit
