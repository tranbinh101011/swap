import { QuoteQuery } from 'quoter/quoter.types'
import { PoolHashHelper } from './PoolHashHelper'

const PLACE_HOLDER_TIME = 1000 * 120 // 2 minutes

export function createQuoteQuery(query: Omit<QuoteQuery, 'hash'>): QuoteQuery {
  const option1 = query as QuoteQuery
  option1.hash = PoolHashHelper.hashQuoteQuery(option1)
  const placeholderNonce = Math.floor(Date.now() / PLACE_HOLDER_TIME)
  option1.placeholderHash = PoolHashHelper.hashQuoteQuery({ ...option1, nonce: placeholderNonce })

  return option1
}
