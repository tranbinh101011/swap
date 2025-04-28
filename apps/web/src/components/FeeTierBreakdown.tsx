import { useTranslation } from '@pancakeswap/localization'
import { Text } from '@pancakeswap/uikit'
import { FeeTierTooltip } from '@pancakeswap/widgets-internal'
import { useInfinityFeeTier } from 'hooks/infinity/useInfinityFeeTier'
import { usePoolById } from 'hooks/infinity/usePool'
import { useMemo } from 'react'
import { Address } from 'viem'

interface FeeTierBreakdownProps {
  poolId?: Address
  chainId?: number
}
export const InfinityFeeTierBreakdown = ({ poolId, chainId }: FeeTierBreakdownProps) => {
  const { t } = useTranslation()
  const [, pool] = usePoolById(poolId, chainId)

  const { protocol, type, percent, lpFee, protocolFee } = useInfinityFeeTier(pool)

  const tooltips = useMemo(() => {
    return (
      <>
        <Text bold> {t('%t% LP', { t: protocol.toUpperCase() })}</Text>
        <Text> - {t('%p%% LP Fee', { p: lpFee.toSignificant(2) })}</Text>
        <Text> - {t('%p%% Protocol Fee', { p: protocolFee.toSignificant(2) })}</Text>
      </>
    )
  }, [lpFee, protocolFee, t, protocol])

  if (!pool) {
    return null
  }

  return <FeeTierTooltip tooltips={tooltips} dynamic={pool?.dynamic} type={type} percent={percent} />
}
