import { Box, Button, HStack } from '@chakra-ui/react'
import { useTranslation } from '@pancakeswap/localization'
import { useRouter } from 'next/router'
import { useCallback } from 'react'
import Tooltip from '@/components/Tooltip'
import { FormattedPoolInfoItem } from '@/hooks/pool/type'
import ChartInfoIcon from '@/icons/misc/ChartInfoIcon'
import SwapPoolItemIcon from '@/icons/misc/SwapPoolItemIcon'
import { colors } from '@/theme/cssVariables'
import { wSolToSol } from '@/utils/token'
import { pageRoutePathnames } from '@/utils/config/routers'
import { logGTMDepositLiquidityEvent } from '@/utils/report/curstomGTMEventTracking'

export const ColumnsPoolActions: React.FC<{
  data: FormattedPoolInfoItem
  onOpenChart?: (pool: FormattedPoolInfoItem) => void
}> = ({ data: pool, onOpenChart }) => {
  const { t } = useTranslation()

  const handleOpenChart = useCallback(() => {
    onOpenChart?.(pool)
  }, [onOpenChart, pool])

  const router = useRouter()

  const onClickSwap = useCallback(() => {
    logGTMDepositLiquidityEvent()
    const getMint = (address: string) => {
      // todo: update to wSolToSol(address) when update to our own swap page
      return address
    }
    const [inputMint, outputMint] = [getMint(pool.mintA.address), getMint(pool.mintB.address)]
    router.push({
      pathname: pageRoutePathnames.swap,
      query: {
        inputMint,
        outputMint
      }
    })
  }, [pool, router])

  const onClickDeposit = useCallback(() => {
    const isStandard = pool.type === 'Standard'
    router.push({
      pathname: isStandard ? '/liquidity/increase' : '/clmm/create-position',
      query: {
        ...(isStandard ? { mode: 'add' } : {}),
        pool_id: pool.id
      }
    })
  }, [pool, router])

  return (
    <HStack justify="flex-end" h="100%">
      <Box>
        <Tooltip usePortal label={t('View pool charts')}>
          <Box
            display="grid"
            placeItems="center"
            cursor="pointer"
            rounded="full"
            bgColor={colors.tertiary}
            px={3}
            py={2}
            onClick={handleOpenChart}
          >
            <ChartInfoIcon strokeWidth={2} color={colors.textSubtle} />
          </Box>
        </Tooltip>
      </Box>
      <Box>
        <Tooltip usePortal label={t('Swap')}>
          <Box
            display="grid"
            placeItems="center"
            cursor="pointer"
            rounded="full"
            bgColor={colors.tertiary}
            px={3}
            py={2}
            onClick={onClickSwap}
          >
            <SwapPoolItemIcon strokeWidth="2" color={colors.textSubtle} />
          </Box>
        </Tooltip>
      </Box>

      <Button
        variant="outline"
        size="xs"
        color={colors.primary60}
        fontWeight={600}
        fontSize="16px"
        borderColor={colors.primary}
        borderWidth="2px"
        borderRadius="12px"
        paddingInline="8px"
        height="32px"
        onClick={onClickDeposit}
      >
        {t('Deposit')}
      </Button>
    </HStack>
  )
}
