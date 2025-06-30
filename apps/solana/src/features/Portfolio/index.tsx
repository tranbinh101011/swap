import { Box } from '@chakra-ui/react'
import { PositionTabValues } from '@/hooks/portfolio/useAllPositionInfo'
import { AcceleraytorAlertChip } from './AcceleraytorAlertChip'
import { CreateFarmTabValues } from './components/SectionMyFarms'
import SectionMyPositions from './components/SectionMyPositions'

export type PortfolioPageQuery = {
  section?: 'overview' | 'my-positions' | 'my-created-farm' | 'acceleraytor'
  position_tab?: PositionTabValues
  create_farm_tab?: CreateFarmTabValues
}

export default function Portfolio() {
  return (
    <Box overflowX="hidden">
      <AcceleraytorAlertChip />
      <SectionMyPositions />
      <Box pb="40px" />
    </Box>
  )
}
