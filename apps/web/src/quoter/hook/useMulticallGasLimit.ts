import { ChainId } from '@pancakeswap/chains'
import { getDefaultGasLimit, getGasLimitOnChain } from '@pancakeswap/multicall'
import { useQuery } from '@tanstack/react-query'
import { atom } from 'jotai'
import { atomFamily } from 'jotai/utils'
import { useMemo } from 'react'

import { getViemClients } from 'utils/viem'

const CHAINS_TO_USE_DEFAULT = [ChainId.BASE]

export function useMulticallGasLimit(chainId?: ChainId) {
  const shouldUseDefault = useMemo(() => Boolean(chainId && CHAINS_TO_USE_DEFAULT.includes(chainId)), [chainId])
  const defaultGasLimit = useMemo(() => getDefaultGasLimit(chainId), [chainId])
  const client = useMemo(() => getViemClients({ chainId }), [chainId])

  const { data: gasLimitOnChain } = useQuery({
    queryKey: [chainId],
    queryFn: async () => {
      if (!chainId) {
        throw new Error('chainId is not defined')
      }
      return getGasLimitOnChain({ chainId, client })
    },
    enabled: Boolean(chainId && client && !shouldUseDefault),
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchInterval: 30_000,
    refetchOnWindowFocus: false,
  })

  return useMemo(
    () => (shouldUseDefault ? defaultGasLimit : gasLimitOnChain),
    [gasLimitOnChain, shouldUseDefault, defaultGasLimit],
  )
}

export const multicallGasLimitAtom = atomFamily((chainId?: ChainId) => {
  return atom(async () => {
    const shouldUseDefault = chainId ? CHAINS_TO_USE_DEFAULT.includes(chainId) : true

    if (shouldUseDefault || !chainId) {
      return getDefaultGasLimit(chainId)
    }

    const client = getViemClients({ chainId })
    return getGasLimitOnChain({ chainId, client })
  })
})
