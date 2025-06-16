/* eslint-disable no-nested-ternary */

import { atomFamily } from 'jotai/utils'
import isEqual from 'lodash/isEqual'
import { PoolData, TokenChartEntry, TokenData, Transaction, TvlChartEntry, VolumeChartEntry } from 'state/info/types'
import { atomWithAsyncRetry } from 'utils/atomWithAsyncRetry'
import { BasePerf, PerfTracker } from 'utils/PerfTracker'

interface TokenInfoParams {
  address: string
  chain: string
  type: 'swap' | 'stableSwap' | 'v3'
}

interface TokenPageParams {
  address: string
  chain?: string
}

interface TokenQueryResponse {
  token: TokenData | undefined
  pool: PoolData[] | undefined
  transactions: Transaction[] | undefined
  chartVolume: VolumeChartEntry[] | undefined
  chartTvl: TvlChartEntry[] | undefined
  charts: TokenChartEntry[] | undefined
}

interface TokenTraceData extends BasePerf {}

export const tokenInfoPageDataAtom = atomFamily((params: TokenInfoParams) => {
  return atomWithAsyncRetry({
    asyncFn: async () => {
      const perf = new PerfTracker<TokenTraceData & TokenInfoParams>(
        'token',
        {
          perf: {},
          flags: {},
          error: '',
          ...params,
        },
        Date.now(),
      )
      try {
        const resp = await fetch(`/api/token/${params.type}/${params.chain}/${params.address}`)
        if (!resp.ok) throw new Error('Fetch error')
        const json = await resp.json()
        perf.success()
        return json as TokenQueryResponse
      } catch (ex) {
        perf.fail(ex)
        throw ex
      } finally {
        perf.track('duration')
        perf.report('token-query')
      }
    },
    fallbackValue: {
      token: undefined,
      pool: undefined,
      transactions: undefined,
      chartVolume: undefined,
      chartTvl: undefined,
      charts: undefined,
    },
  })
}, isEqual)
