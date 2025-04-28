import { Box, Flex, Spinner } from '@pancakeswap/uikit'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { ChartToolTip } from './ChartToolTip'
import { CurrentPriceLabel } from './CurrentPriceLabel'
import { ActionButton, ControlsWrapper } from './styled'
import { BasicChartLiquidityProps } from './type'

const ZOOM_INTERVAL = 20

const CustomBar = ({
  x,
  y,
  width,
  height,
  fill,
}: {
  x: number
  y: number
  width: number
  height: number
  fill: string
}) => {
  return (
    <g>
      <rect x={x} y={y} fill={fill} width={width} height={height} rx="2" />
    </g>
  )
}

export const BasicChartLiquidity: React.FC<BasicChartLiquidityProps> = ({ poolInfo, liquidityChartData }) => {
  const [zoomLevel, setZoomLevel] = useState(0)
  const [zoomInDisabled, setZoomInDisabled] = useState(false)

  const handleZoomIn = useCallback(() => {
    if (!zoomInDisabled) {
      setZoomLevel(zoomLevel + 1)
    }
  }, [zoomInDisabled, zoomLevel])

  const handleZoomOut = useCallback(() => {
    setZoomInDisabled(false)
    setZoomLevel((z) => z - 1)
  }, [])

  const zoomedData = useMemo(() => {
    if (liquidityChartData) {
      if (zoomLevel <= 0) return liquidityChartData
      return liquidityChartData.slice(ZOOM_INTERVAL * zoomLevel, -ZOOM_INTERVAL * zoomLevel)
    }
    return undefined
  }, [liquidityChartData, zoomLevel])

  useEffect(() => {
    if (!liquidityChartData || !liquidityChartData.length) {
      setZoomInDisabled(true)
    } else {
      setZoomInDisabled(2 * ZOOM_INTERVAL * (zoomLevel + 1) + 1 >= liquidityChartData?.length)
    }
  }, [zoomLevel, liquidityChartData])

  if (!liquidityChartData) {
    return (
      <Box height="380px" mb="-20px">
        <ResponsiveContainer width="100%" height="100%">
          <Flex justifyContent="center">
            <Spinner />
          </Flex>
        </ResponsiveContainer>
      </Box>
    )
  }

  return (
    <Box height="380px" mb="-20px">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={zoomedData}
          margin={{
            top: 0,
            right: 0,
            left: 0,
            bottom: 60,
          }}
        >
          <Tooltip
            content={(props) => (
              <ChartToolTip
                {...props.payload?.[0]?.payload}
                currentPrice={poolInfo?.token0Price}
                currency0={poolInfo?.token0.wrapped}
                currency1={poolInfo?.token1.wrapped}
              />
            )}
          />
          <XAxis reversed tick={false} />
          <Bar dataKey="activeLiquidity" fill="#2172E5" isAnimationActive={false} shape={CustomBar}>
            {zoomedData?.map((entry) => {
              return <Cell key={`cell-${entry.index}`} fill={entry.isCurrent ? '#ED4B9E' : '#31D0AA'} />
            })}
            <LabelList
              dataKey="activeLiquidity"
              position="inside"
              content={(props) => {
                return poolInfo ? (
                  <CurrentPriceLabel
                    x={Number(props.x) ?? 0}
                    index={(props as any).index}
                    poolInfo={poolInfo}
                    data={zoomedData}
                  />
                ) : null
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <ControlsWrapper>
        <ActionButton disabled={false} onClick={handleZoomOut}>
          -
        </ActionButton>
        <ActionButton disabled={zoomInDisabled} onClick={handleZoomIn}>
          +
        </ActionButton>
      </ControlsWrapper>
    </Box>
  )
}
