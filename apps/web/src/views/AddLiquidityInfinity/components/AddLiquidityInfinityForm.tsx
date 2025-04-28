import { Card, CardBody } from '@pancakeswap/uikit'
import styled from 'styled-components'

import { useInfinityPoolIdRouteParams } from 'hooks/dynamicRoute/usePoolIdRoute'
import { usePoolType } from '../hooks/usePoolType'
import { BinPriceRangePanel } from './BinPriceRangePanel'
import { CLPriceRangePanel } from './CLPriceRangePanel'
import { InfoPanel } from './InfoPanel'
import { ResponsiveColumns } from './styles'
import { SubmitButton } from './SubmitButton'

const StyledCard = styled(Card)`
  width: 100%;
`

export const AddLiquidityInfinityForm = () => {
  const { chainId, poolId } = useInfinityPoolIdRouteParams()
  const poolType = usePoolType({ poolId, chainId })

  return (
    <ResponsiveColumns>
      <InfoPanel poolId={poolId} chainId={chainId} />

      <StyledCard style={{ overflow: 'visible', width: '100%' }}>
        <CardBody>
          {poolType === 'CL' && <CLPriceRangePanel />}
          {poolType === 'Bin' && <BinPriceRangePanel />}
          <SubmitButton />
        </CardBody>
      </StyledCard>
    </ResponsiveColumns>
  )
}
