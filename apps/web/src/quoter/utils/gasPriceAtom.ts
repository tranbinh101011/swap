import { ChainId } from '@pancakeswap/chains'
import { atomFamily } from 'jotai/utils'
import { createPublicClient, fallback, http, PublicClient } from 'viem'
import { PUBLIC_NODES } from 'config/nodes'
import { CHAINS } from 'config/chains'
import { atomWithAsyncRetry } from 'utils/atomWithAsyncRetry'
import { publicClient } from 'utils/viem'

const BSC_CUSTOM_NODE = 'https://bsc-dataseed.bnbchain.org'

const gasPriceClients: Record<ChainId, PublicClient> = CHAINS.reduce((clients, chain) => {
  const transport =
    chain.id === ChainId.BSC
      ? http(BSC_CUSTOM_NODE, { timeout: 15_000 })
      : fallback(
          PUBLIC_NODES[chain.id].map((url) => http(url, { timeout: 15_000 })),
          { rank: false },
        )

  // eslint-disable-next-line no-param-reassign
  clients[chain.id] = createPublicClient({
    chain,
    transport,
  })

  return clients
}, {} as Record<ChainId, PublicClient>)

export const gasPriceWeiAtom = atomFamily((chainId?: ChainId) => {
  return atomWithAsyncRetry({
    asyncFn: async () => {
      if (!chainId) {
        return undefined
      }
      return gasPriceClients[chainId].getGasPrice()
    },
    fallbackValue: () => {
      const client = publicClient({ chainId })
      return client.getGasPrice()
    },
  })
})
