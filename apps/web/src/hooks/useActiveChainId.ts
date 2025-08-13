import { ChainId } from '@pancakeswap/chains'
import { getChainId } from 'config/chains'
import { atom, useAtom, useAtomValue } from 'jotai'
import { useRouter } from 'next/router'
import { useDeferredValue, useEffect, useMemo } from 'react'
import { isChainSupported } from 'utils/wagmi'
import { useAccount } from 'wagmi'
// import { useSessionChainId } from './useSessionChainId'

export const queryChainIdAtom = atom(-1) // -1 unload, 0 no chainId on query

queryChainIdAtom.onMount = (set) => {
  const params = new URL(window.location.href).searchParams
  let chainId
  // chain has higher priority than chainId
  // keep chainId for backward compatible
  const c = params.get('chain')
  if (!c) {
    chainId = params.get('chainId')
  } else {
    chainId = getChainId(c)
  }
  if (isChainSupported(+chainId)) {
    set(+chainId)
  } else {
    set(0)
  }
}

export function useLocalNetworkChain() {
  const [queryChainId, setQueryChainId] = useAtom(queryChainIdAtom)

  const { query } = useRouter()
  const chainId = +(getChainId(query.chain as string) || queryChainId)

  useEffect(() => {
    if (chainId) {
      setQueryChainId(chainId)
    }
  }, [chainId, setQueryChainId])

  if (isChainSupported(chainId)) {
    return chainId
  }

  return undefined
}

export const useActiveChainId = (checkChainId?: number) => {
  const localChainId = useLocalNetworkChain()
  const queryChainId = useAtomValue(queryChainIdAtom)

  const { chainId: wagmiChainId, connector } = useAccount()
  const chainId = localChainId ?? wagmiChainId ?? (queryChainId >= 0 ? ChainId.BSC : undefined)

  const isNotMatched = useDeferredValue(wagmiChainId && localChainId && wagmiChainId !== localChainId)

  // Only log when there are significant changes
  const shouldLog = useMemo(() => {
    const now = Date.now()
    if (typeof window !== 'undefined') {
      if (!(window as any).lastChainLog || now - (window as any).lastChainLog > 5000) { // Log every 5 seconds max
        (window as any).lastChainLog = now
        return true
      }
    }
    return false
  }, [connector?.id, wagmiChainId])

  if (shouldLog) {
    console.log('🔍 [useActiveChainId] Chain check:', { 
      wagmiChainId, 
      localChainId,
      checkChainId,
      connectorId: connector?.id,
      connectorName: connector?.name
    })
  }

  const isWrongNetwork = useMemo(
    () => {
      // If using Private Key Connector, always consider BSC as correct
      if (connector?.id === 'privateKey') {
        const isWrong = Boolean(checkChainId && checkChainId !== ChainId.BSC)
        if (isWrong && shouldLog) {
          console.log('🎯 [useActiveChainId] Private Key Connector network check:', { 
            checkChainId, 
            bscChainId: ChainId.BSC,
            isWrong 
          })
        }
        return isWrong
      }
      
      // Original wagmi logic for real wallets
      const result = Boolean(
        ((wagmiChainId && !isChainSupported(wagmiChainId)) ?? false) ||
          isNotMatched ||
          (checkChainId && checkChainId !== wagmiChainId),
      )
      
      if (shouldLog) {
        console.log('🔧 [useActiveChainId] Standard wagmi network check:', { 
          wagmiChainId, 
          checkChainId, 
          isWrong: result 
        })
      }
      
      return result
    },
    [wagmiChainId, isNotMatched, checkChainId, connector?.id, shouldLog],
  )

  return useMemo(
    () => ({
      chainId: chainId && isChainSupported(chainId) ? chainId : ChainId.BSC,
      isWrongNetwork,
      isNotMatched,
    }),
    [chainId, isWrongNetwork, isNotMatched],
  )
}
