import { HOOK_CATEGORY, HookData } from '@pancakeswap/infinity-sdk'
import { useTranslation } from '@pancakeswap/localization'
import { Percent } from '@pancakeswap/sdk'
import { Flex, InfoIcon, Text, useModal } from '@pancakeswap/uikit'
import { FeeTierTooltip, Liquidity } from '@pancakeswap/widgets-internal'
import { useInfinityFeeTier } from 'hooks/infinity/useInfinityFeeTier'
import { usePoolById } from 'hooks/infinity/usePool'
import { useCallback, useMemo } from 'react'
import { Address } from 'viem'

interface FeeTierBreakdownProps {
  poolId?: Address
  chainId?: number
  hookData?: HookData
  infoIconVisible?: boolean
}
export const InfinityFeeTierBreakdown = ({
  poolId,
  chainId,
  hookData,
  infoIconVisible = true,
}: FeeTierBreakdownProps) => {
  const { t } = useTranslation()
  const [, pool] = usePoolById(poolId, chainId)

  const { protocol, type, percent, lpFee, protocolFee } = useInfinityFeeTier(pool)
  const [onPresentHookDetailModal] = useModal(<Liquidity.HookModal hookData={hookData} />)
  const handleInfoIconClick = useCallback(
    (e) => {
      e.stopPropagation()
      e.preventDefault()
      onPresentHookDetailModal()
    },
    [onPresentHookDetailModal],
  )

  const p = useMemo(() => {
    if (percent.equalTo(0) && hookData?.defaultFee) {
      return new Percent(hookData.defaultFee, 1e6)
    }
    return percent
  }, [hookData?.defaultFee, percent])

  const tooltips = useMemo(() => {
    return (
      <>
        <Text bold> {t('%t% LP', { t: protocol.toUpperCase() })}</Text>
        <Text>
          {' '}
          -{' '}
          {t('%p%% LP Fee', {
            p: (lpFee.equalTo(0) ? new Percent(hookData?.defaultFee ?? 0, 1e6) : lpFee).toSignificant(2),
          })}
        </Text>
        <Text> - {t('%p%% Protocol Fee', { p: protocolFee.toSignificant(2) })}</Text>
      </>
    )
  }, [lpFee, protocolFee, t, protocol])

  if (!pool) {
    return null
  }

  return (
    <Flex alignItems="center">
      <FeeTierTooltip tooltips={tooltips} dynamic={pool?.dynamic} type={type} percent={p} />
      {hookData?.category?.includes(HOOK_CATEGORY.DynamicFees) && infoIconVisible ? (
        <InfoIcon
          color="textSubtle"
          width={18}
          height={18}
          ml="4px"
          onClick={handleInfoIconClick}
          style={{ cursor: 'pointer' }}
        />
      ) : null}
    </Flex>
  )
}
