import BigNumber from 'bignumber.js'
import _toNumber from 'lodash/toNumber'
import { useMemo } from 'react'
import { getBCakeMultiplier } from 'views/Farms/components/YieldBooster/components/BCakeCalculator'
import { useUserLockedCakeStatus } from 'views/Farms/hooks/useUserLockedCakeStatus'
import useAvgLockDuration from 'views/Pools/components/LockedPool/hooks/useAvgLockDuration'
import { secondsToDays } from 'views/Pools/components/utils/formatSecondsToWeeks'
import useFarmBoosterConstants from './useFarmBoosterConstants'

export const useGetCalculatorMultiplier = (
  userBalanceInFarm: BigNumber,
  lpTokenStakedAmount: BigNumber,
  lockedAmount: BigNumber,
  userLockDuration: number,
) => {
  const { avgLockDurationsInSeconds } = useAvgLockDuration()
  const { isLoading, totalLockedAmount } = useUserLockedCakeStatus()
  const { constants, isLoading: isFarmConstantsLoading } = useFarmBoosterConstants()
  const bCakeMultiplier = useMemo(() => {
    const result =
      !isLoading && !isFarmConstantsLoading && lockedAmount && totalLockedAmount
        ? getBCakeMultiplier(
            userBalanceInFarm, // userBalanceInFarm,
            lockedAmount, // userLockAmount
            secondsToDays(userLockDuration), // userLockDuration
            totalLockedAmount, // totalLockAmount
            lpTokenStakedAmount, // lpBalanceOfFarm
            avgLockDurationsInSeconds ? secondsToDays(avgLockDurationsInSeconds) : 280, // AverageLockDuration,
            constants?.cA ?? 1,
            constants?.cB ?? 1,
          )
        : null
    return !result || result.toString() === 'NaN' ? '1.000' : result.toFixed(3)
  }, [
    userBalanceInFarm,
    lpTokenStakedAmount,
    totalLockedAmount,
    avgLockDurationsInSeconds,
    lockedAmount,
    isLoading,
    isFarmConstantsLoading,
    userLockDuration,
    constants,
  ])
  return _toNumber(bCakeMultiplier)
}
