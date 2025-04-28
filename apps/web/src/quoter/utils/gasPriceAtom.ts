import { ChainId } from '@pancakeswap/chains'
import { atom } from 'jotai'
import { atomFamily } from 'jotai/utils'
import { publicClient } from 'utils/viem'

export const gasPriceWeiAtom = atomFamily((chainId?: ChainId) => {
  return atom(async () => {
    if (!chainId) {
      return undefined
    }
    const client = publicClient({ chainId })
    return client.getGasPrice()
  })
})
