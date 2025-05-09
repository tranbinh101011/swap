import { QuoteQuery } from 'quoter/quoter.types'
import { createViemPublicClientGetter } from 'utils/viem'
import { PoolHashHelper } from './PoolHashHelper'

const PLACE_HOLDER_TIME = 1000 * 120 // 2 minutes

const cache = new Map<string, QuoteQuery>()
export function createQuoteQuery(query: Omit<QuoteQuery, 'hash' | 'createTime'>): QuoteQuery {
  const hash = PoolHashHelper.hashQuoteQuery(query as QuoteQuery)
  if (cache.has(hash)) {
    return cache.get(hash) as QuoteQuery
  }

  const option1 = { ...(query as QuoteQuery) }
  option1.hash = hash
  option1.createTime = Date.now()
  const placeholderNonce = Math.floor(Date.now() / PLACE_HOLDER_TIME)
  option1.placeholderHash = PoolHashHelper.hashQuoteQuery({ ...option1, nonce: placeholderNonce })
  const controller = new AbortController()
  option1.provider = createViemPublicClientGetter({
    transportSignal: controller.signal,
  })
  option1.signal = controller.signal
  option1.controller = controller
  cache.set(hash, option1)

  return option1
}
