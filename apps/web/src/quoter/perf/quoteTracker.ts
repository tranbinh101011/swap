import { getCurrencyAddress, TradeType } from '@pancakeswap/swap-sdk-core'
import { accountActiveChainAtom } from 'hooks/useAccountActiveChain'
import { atom } from 'jotai'
import { atomFamily } from 'jotai/utils'
import { QuoteQuery } from 'quoter/quoter.types'
import { getLogger } from 'utils/datadog'

type TrackKey = 'start' | 'pool_success' | 'pool_error' | 'success' | 'fail' | 'duration'
type QuoteTrace = {
  quoteHash: string
  createAt: number
  currencyA?: `0x${string}` | ''
  currencyB?: `0x${string}` | ''
  amount: string
  tradeType: TradeType
  v2Swap: boolean
  v3Swap: boolean
  infinitySwap: boolean
  xSwap: boolean
  perf: Record<TrackKey, number>
  chainId?: number
  account?: `0x${string}`
  route?: string
}

const logger = getLogger('quote')
export class RouteTracker {
  private records: [TrackKey, number][] = []

  private trace: QuoteTrace

  private routeKey: string

  private start: number

  constructor(trace: QuoteTrace, routeKey: string, start: number) {
    this.trace = trace
    this.routeKey = routeKey
    this.start = start
  }

  public track(key: TrackKey) {
    this.records.push([key, Date.now() - this.start])
  }

  public getRecords() {
    const records: Record<string, number> = {}
    this.records.forEach(([key, value]) => {
      records[key] = value
    })
    return records as Record<TrackKey, number>
  }

  public report() {
    const records = this.getRecords()
    this.trace.perf = records
    const end = this.trace.perf.success || this.trace.perf.fail
    const start = this.trace.perf.start
    const duration = end - start
    this.trace.perf.duration = duration
    logger.info(`quote-${this.routeKey}`, this.trace)
  }
}

export const quoteTraceAtom = atomFamily(
  (params: QuoteQuery) => {
    return atom((get) => {
      const { account } = get(accountActiveChainAtom)
      const trace: QuoteTrace = {
        quoteHash: params.hash,
        createAt: Date.now(),
        currencyA: params.baseCurrency ? getCurrencyAddress(params.baseCurrency) : '',
        currencyB: params.currency ? getCurrencyAddress(params.currency) : '',
        tradeType: params.tradeType || TradeType.EXACT_INPUT,
        amount: `${params.amount?.quotient || 0}`,
        v2Swap: !!params.v2Swap,
        v3Swap: !!params.v3Swap,
        infinitySwap: params.infinitySwap,
        xSwap: params.xEnabled,
        chainId: params.currency?.chainId,
        account,
        route: params.routeKey,
        perf: {
          start: 0,
          pool_success: 0,
          pool_error: 0,
          success: 0,
          fail: 0,
          duration: 0,
        },
      }
      const tracker = new RouteTracker(trace, params.routeKey!, params.createTime)
      return {
        trace,
        tracker,
      }
    })
  },
  (a, b) => a.hash === b.hash && a.routeKey === b.routeKey,
)
