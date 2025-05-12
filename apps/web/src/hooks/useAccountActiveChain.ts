import { useAtom, useAtomValue } from 'jotai'
import { atomWithProxy } from 'jotai-valtio'
import { useEffect } from 'react'
import { proxy } from 'valtio'
import { useAccount } from 'wagmi'
import { useActiveChainId } from './useActiveChainId'

interface AccountChainState {
  account?: `0x${string}`
  chainId: number | undefined
  status: 'connected' | 'disconnected' | 'connecting' | 'reconnecting' | null
}

const accountChainProxy = proxy<AccountChainState>({ chainId: undefined, status: null })
export const accountActiveChainAtom = atomWithProxy(accountChainProxy)

const useAccountActiveChain = () => {
  const { address: account, status } = useAccount()
  const { chainId } = useActiveChainId()

  const [, setProxy] = useAtom(accountActiveChainAtom)

  useEffect(() => {
    setProxy({ account, chainId, status })
  }, [account, chainId, status, setProxy])

  return useAtomValue(accountActiveChainAtom)
}

export default useAccountActiveChain
