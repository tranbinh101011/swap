import { useCallback } from 'react'
import { logger } from 'utils/datadog'
import type { Address } from 'viem'
import { useAccount, useChainId } from 'wagmi'
import { useIDOContract } from '../ido/useIDOContract'

enum SignResponseCode {
  Normal = '000000',
  SystemError = '000001',
  IllegalParams = '000002',
  SignatureError = '001012',
  IllegalTimestamp = '351005',
  IllegalNonce = '351082',
  IllegalAddress = '351026',
  RestrictedAddress = '351083',
  AlreadyParticipated = '351084',
  MFANeeded = '351022',
  InvalidMFA = '351023',
}

declare global {
  interface Window {
    binancew3w: {
      pcs: {
        sign: (params: { binanceChainId: string; contractAddress: string; address: string }) => Promise<{
          code: SignResponseCode
          message: string
          success: boolean
          data: {
            signature: string
            expireAt: number
          }
        }>
      }
    }
  }
}

export const useW3WAccountSign = () => {
  const { address } = useAccount()
  const chainId = useChainId()
  const contract = useIDOContract()

  const sign = useCallback(async () => {
    if (!address) throw new Error('No address provided')

    return w3wSign({
      chainId,
      address,
      contractAddress: contract?.address ?? '',
    })
  }, [address, contract?.address, chainId])

  return sign
}

export class W3WSignRestrictedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'W3WSignRestrictedError'
  }
}

class W3WSignNotSupportedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'W3WSignNotSupportedError'
  }
}

const w3wSign = async ({
  chainId,
  address,
  contractAddress,
}: {
  chainId: number
  address: Address
  contractAddress: Address
}): Promise<{
  signature: string | null
  expireAt: number
}> => {
  try {
    if (typeof window === 'undefined' || typeof window.binancew3w?.pcs?.sign === 'undefined') {
      throw new W3WSignNotSupportedError('W3W sign not supported')
    }

    const result = await window.binancew3w.pcs.sign({
      binanceChainId: `${chainId}`,
      contractAddress,
      address,
    })

    if (result.code === SignResponseCode.RestrictedAddress) {
      throw new W3WSignRestrictedError('Restricted address')
    }

    if (result.code !== SignResponseCode.Normal) {
      throw new Error('Failed to sign')
    }

    return {
      signature: result.data?.signature,
      expireAt: result.data?.expireAt,
    }
  } catch (error) {
    console.error('Error signing W3W account:', error)
    logger.error('Error get W3W sign', {
      error,
      chainId,
      contractAddress,
      address,
    })
    return {
      signature: null,
      expireAt: 0,
    }
  }
}
