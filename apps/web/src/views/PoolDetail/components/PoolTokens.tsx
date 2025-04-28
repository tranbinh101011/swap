import { Flex, RowBetween, Text } from '@pancakeswap/uikit'
import { CurrencyLogo } from '@pancakeswap/widgets-internal'
import { useMemo } from 'react'
import { PoolInfo } from 'state/farmsV4/state/type'
import styled from 'styled-components'
import { formatAmount } from 'utils/formatInfoNumbers'
import { usePoolSymbol } from '../hooks/usePoolSymbol'

const StyledPoolTokens = styled(Flex)`
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  background-color: ${({ theme }) => theme.colors.background};
  padding: 16px;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
  border-radius: 16px;
`

const formatOptions = {
  displayThreshold: 0.001,
}

type PoolTokensProps = {
  poolInfo?: PoolInfo | null
}
export const PoolTokens: React.FC<PoolTokensProps> = ({ poolInfo }) => {
  const { symbol0, symbol1, currency0, currency1 } = usePoolSymbol()
  const [token0Tvl, token1Tvl] = useMemo(() => {
    if (!poolInfo?.tvlToken0 || !poolInfo?.tvlToken1) return [0, 0]
    return [
      formatAmount(Number(poolInfo.tvlToken0 ?? 0), formatOptions),
      formatAmount(Number(poolInfo.tvlToken1 ?? 0), formatOptions),
    ]
  }, [poolInfo?.tvlToken0, poolInfo?.tvlToken1])

  if (!poolInfo) {
    return null
  }

  return (
    <StyledPoolTokens>
      <RowBetween>
        <Flex>
          <CurrencyLogo currency={currency0} size="20px" />
          <Text fontSize={14} ml="8px">
            {symbol0}
          </Text>
        </Flex>
        <Text small>{token0Tvl}</Text>
      </RowBetween>
      <RowBetween>
        <Flex>
          <CurrencyLogo currency={currency1} size="20px" />
          <Text fontSize={14} ml="8px">
            {symbol1}
          </Text>
        </Flex>
        <Text small>{token1Tvl}</Text>
      </RowBetween>
    </StyledPoolTokens>
  )
}
