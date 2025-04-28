import { InfinityBinPool, InfinityClPool, Route, SmartRouter } from '@pancakeswap/smart-router'
import { useQueries } from '@tanstack/react-query'
import { useActiveChainId } from 'hooks/useActiveChainId'
import set from 'lodash/set'
import { useMemo } from 'react'
import { publicClient } from 'utils/viem'
import { Address, ContractFunctionParameters, zeroAddress } from 'viem'
import { parseAbi } from 'viem/utils'
import { useAccount } from 'wagmi'

const whiteListBrevisDiscountHooks = [
  // '0x9F0D5091D31a7801d34da352572BAc84e8Ac48Ad',
  // '0x4910a4852A06D0F6B206bd737ea3C98866Be796C',
] as Address[]

export const useBrevisHookDiscount = (pools: Route['pools']) => {
  const { chainId } = useActiveChainId()
  const { address: account } = useAccount()
  const brevisHookPools = pools.filter(
    (pool) =>
      SmartRouter.isInfinityBinPool(pool) ||
      (SmartRouter.isInfinityClPool(pool) && pool?.hooks && whiteListBrevisDiscountHooks.includes(pool.hooks)),
  ) as Array<InfinityBinPool | InfinityClPool>

  const queries = useMemo(() => {
    return brevisHookPools.map((pool) => ({
      queryKey: ['brevisHookDiscount', pool.id],
      queryFn: () => getBrevisHookDiscountData({ chainId, pool, account }),

      enabled: !!pool && !!chainId,
    }))
  }, [account, chainId, brevisHookPools])

  return useQueries({
    queries,
    combine(result) {
      return result.reduce((acc, item) => {
        if (item.data) {
          set(acc, item.data.hooks, {
            discountFee: item.data.discountFee,
            originalFee: item.data.originalFee,
          })
        }
        return acc
      }, {} as Record<Address, { discountFee: number; originalFee: number }>)
    },
  })
}

const getBrevisHookDiscountData = async ({
  chainId,
  pool,
  account,
}: {
  chainId: number | undefined
  pool: InfinityBinPool | InfinityClPool
  account: Address | undefined
}) => {
  if (!chainId || !pool.hooks) return undefined
  const client = publicClient({ chainId })
  const abi = parseAbi(['function getFee(address) public view returns (uint24)'])

  const userFeeCall = {
    address: pool.hooks,
    abi,
    functionName: 'getFee',
    args: [account ?? zeroAddress],
  } as const satisfies ContractFunctionParameters
  const noDiscountUserCall = {
    address: pool.hooks,
    abi,
    functionName: 'getFee',
    args: [zeroAddress],
  } as const satisfies ContractFunctionParameters

  const [discountFee, originalFee] = await client.multicall({
    contracts: [userFeeCall, noDiscountUserCall],
    allowFailure: false,
  })

  return {
    hooks: pool.hooks,
    discountFee,
    originalFee,
  }
}
