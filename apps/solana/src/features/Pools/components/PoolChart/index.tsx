import { Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay } from '@chakra-ui/react'
import { ReactNode, useMemo, useState } from 'react'
import Tabs from '@/components/Tabs'
import useFetchPoolChartData from '@/hooks/pool/useFetchPoolChartData'
import { useAppStore } from '@/store'
import { shrinkToValue } from '@/utils/shrinkToValue'
import Chart from './Chart'
import { TimeType, availableTimeType } from './const'
import ChartTooltip from './ChartTooltip'

export default function PoolChartModal<T extends string>({
  poolAddress,
  baseMint,
  isOpen,
  onClose,
  renderModalHeader,
  categories
}: {
  poolAddress: string | undefined
  baseMint?: string
  isOpen: boolean

  /** it base on provided chartData */
  categories: { label: string; value: T }[]
  renderModalHeader?: ((utils: { isOpen?: boolean }) => ReactNode) | ReactNode
  onClose?: () => void
}) {
  return (
    <Modal size="xl" isOpen={isOpen} onClose={onClose ?? (() => {})}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{shrinkToValue(renderModalHeader, [{ isOpen }])}</ModalHeader>
        <ModalCloseButton />

        <ModalBody py={0}>
          <ChartWindow poolAddress={poolAddress} baseMint={baseMint} categories={categories} />
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}

/** used in mobile  */
export function ChartWindow<T extends string>({
  poolAddress,
  baseMint,
  categories
}: {
  poolAddress?: string
  baseMint?: string
  /** it base on provided chartData */
  categories: { label: string; value: T }[]
}) {
  const isMobile = useAppStore((s) => s.isMobile)
  const [currentCategory, setCurrentCategory] = useState<T>(categories[0].value)
  const currentCategoryLabel = useMemo(
    () => categories.find((c) => c.value === currentCategory)?.label ?? '',
    [categories, currentCategory]
  )
  const [currentTimeType, setCurrentTimeType] = useState<TimeType>(availableTimeType[0])
  const { data, isLoading, isEmptyResult } = useFetchPoolChartData({
    category: currentCategory === 'liquidity' ? 'liquidity' : 'volume',
    poolAddress,
    baseMint,
    timeType: currentTimeType
  })
  if (isMobile && isEmptyResult) return null
  return (
    <Chart<(typeof data)[0]>
      isEmpty={isEmptyResult}
      isActionRunning={isLoading}
      data={data}
      currentCategoryLabel={currentCategoryLabel}
      xKey="time"
      yKey="v"
      renderToolTip={
        <ChartTooltip
          symbol={currentCategory === 'volume' ? '$' : undefined}
          unit={currentCategory === 'volume' ? 'USD' : undefined}
          category={currentCategoryLabel}
        />
      }
      renderTimeTypeTabs={
        <Tabs
          style={{
            pointerEvents: currentCategory === 'volume' ? 'auto' : 'none',
            visibility: currentCategory === 'volume' ? 'visible' : 'hidden'
          }}
          scale={isMobile ? 'xs' : 'sm'}
          variant="subtle"
          items={availableTimeType}
          value={currentTimeType}
          onChange={(value) => {
            setCurrentTimeType(value)
          }}
          ml="auto"
        />
      }
      renderTabs={
        <Tabs
          fullWidth
          tabItemSX={isMobile ? {} : { py: '12px', height: '40px' }}
          scale={isMobile ? 'xs' : 'sm'}
          variant="subtle"
          items={categories}
          value={currentCategory}
          onChange={(value) => {
            setCurrentCategory(value)
          }}
          my={2}
        />
      }
    />
  )
}
