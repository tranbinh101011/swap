import { getTokenList } from '@pancakeswap/token-lists/react'
import { DEFAULT_ACTIVE_LIST_URLS } from 'config/constants/lists'
import keyBy from 'lodash/keyBy'
import { safeGetAddress } from 'utils'

export const queryTokenList = async () => {
  const results = await Promise.allSettled(DEFAULT_ACTIVE_LIST_URLS.map((url) => getTokenList(url)))

  const lists = results
    .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
    .map((result) => result.value.tokens)
    .flat()
    .map((x) => ({ ...x, address: safeGetAddress(x.address) }))
    .filter((x) => x.address)

  return keyBy(lists, (x) => `${x.chainId}-${x.address}`)
}
