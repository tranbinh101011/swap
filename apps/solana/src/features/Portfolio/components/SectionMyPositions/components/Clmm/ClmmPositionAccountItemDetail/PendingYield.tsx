import { Flex, HStack, Text } from '@chakra-ui/react'
import { ApiV3Token } from '@pancakeswap/solana-core-sdk'
import { useTranslation } from '@pancakeswap/localization'
import Button from '@/components/Button'
import TokenAvatar from '@/components/TokenAvatar'
import useResponsive from '@/hooks/useResponsive'
import { colors } from '@/theme/cssVariables'
import { formatCurrency } from '@/utils/numberish/formatter'
import { getMintSymbol } from '@/utils/token'
import Tooltip from '@/components/Tooltip'

type PendingYieldProps = {
  pendingYield?: string
  isLoading?: boolean
  hasReward?: boolean
  rewardInfos: { mint: ApiV3Token; amount: string; amountUSD: string }[]
  onHarvest: () => void
}

export default function PendingYield({ isLoading, hasReward, pendingYield, rewardInfos, onHarvest }: PendingYieldProps) {
  const { t } = useTranslation()
  const { isMobile, isTablet } = useResponsive()
  return (
    <Flex flex={1} justify="space-around" w="full" fontSize="sm" flexDirection="column" gap={3} p={[4, 0]}>
      <HStack justifyContent="space-between">
        <HStack>
          <Text color={colors.textSecondary} whiteSpace="nowrap">
            {t('Pending Yield')}
          </Text>
          <Text color={colors.textPrimary} whiteSpace="nowrap">
            ({pendingYield ?? '$0'})
          </Text>
        </HStack>
        <Tooltip
          label={
            hasReward
              ? t('Harvest Rewards')
              : t('No rewards to harvest yet. Check back later — your earnings will grow as users trade in this pool.')
          }
        >
          <Button
            isLoading={isLoading}
            isDisabled={!hasReward}
            onClick={onHarvest}
            width={['69px']}
            height="9"
            borderRadius="xl"
            size="xs"
            px={1}
            fontSize="md"
            variant="outline"
            style={{
              borderColor: colors.primary60,
              color: colors.primary60
            }}
          >
            {t('Harvest')}
          </Button>
        </Tooltip>
      </HStack>

      <Flex display="grid" gridTemplateColumns="repeat(1, 1fr)" columnGap={0} rowGap={2}>
        {rewardInfos
          .filter((r) => {
            return Number(r.amount) !== 0
          })
          .map((r, index) => (
            <Flex key={r.mint.address} alignItems="center" gap={1} justifyContent="start">
              <TokenAvatar key={`pool-reward-${r.mint.address}`} size="sm" token={r.mint} />
              <Text color={colors.textPrimary}>
                {formatCurrency(r.amount, {
                  abbreviated: true,
                  decimalPlaces: isTablet ? 2 : 3,
                  maximumDecimalTrailingZeroes: 2
                })}
              </Text>
              <Text color={colors.textSecondary} display={['block', 'none', 'block']}>
                {getMintSymbol({ mint: r.mint, transformSol: true })}
              </Text>
              <Text color={colors.textPrimary}>
                (
                {formatCurrency(r.amountUSD, {
                  symbol: '$',
                  abbreviated: true,
                  decimalPlaces: isMobile ? 3 : 2,
                  maximumDecimalTrailingZeroes: 2
                })}
                )
              </Text>
            </Flex>
          ))}
      </Flex>
    </Flex>
  )
}
