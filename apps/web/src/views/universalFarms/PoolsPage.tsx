import { useIntersectionObserver } from '@pancakeswap/hooks'
import { Flex, Spinner, TableView, useMatchBreakpoints } from '@pancakeswap/uikit'
import { useRouter } from 'next/router'
import { Suspense, useCallback, useEffect, useMemo } from 'react'
import styled from 'styled-components'

import { useAtomValue, useSetAtom } from 'jotai'
import { getFarmKey } from 'state/farmsV4/search/farm.util'
import { PoolInfo } from 'state/farmsV4/state/type'
import { useListStateReady } from 'state/lists/lists'
import { farmsSearchAtom, farmsSearchPagingAtom } from './atom/farmsSearchAtom'
import { searchQueryAtom, updateFilterAtom, updateSortAtom } from './atom/searchQueryAtom'
import {
  Card,
  CardBody,
  CardHeader,
  getPoolDetailPageLink,
  IPoolsFilterPanelProps,
  ListView,
  PoolsFilterPanel,
  useColumnConfig,
} from './components'
import { AddLiquidityButton } from './components/AddLiquidityButton'
import { FarmSearchContextProvider } from './hooks/useFarmSearchContext'
import { farmQueryToUrlParams, getIndexByProtocols } from './utils/queryParser'

const PoolsContent = styled.div`
  min-height: calc(100vh - 64px - 56px);
`

export const PoolsPage = () => {
  const nextRouter = useRouter()
  const { isMobile, isMd } = useMatchBreakpoints()

  const updateFilter = useSetAtom(updateFilterAtom)
  const query = useAtomValue(searchQueryAtom)
  const isReady = useListStateReady()

  useEffect(() => {
    const params = farmQueryToUrlParams(query)
    nextRouter.replace({
      pathname: nextRouter.pathname,
      query: params,
    })
  }, [query])

  const handleFilterChange: IPoolsFilterPanelProps['onChange'] = useCallback(
    (newFilters) => {
      updateFilter(newFilters)
    },
    [updateFilter],
  )

  const poolsFilter = useMemo(
    () => ({
      selectedProtocolIndex: getIndexByProtocols(query.protocols),
      selectedNetwork: query.chains,
      search: query.keywords,
    }),
    [query],
  )

  return (
    <FarmSearchContextProvider>
      <Card>
        <CardHeader p={isMobile ? '16px' : undefined}>
          <PoolsFilterPanel onChange={handleFilterChange} value={poolsFilter}>
            {(isMobile || isMd) && <AddLiquidityButton height="40px" scale="sm" width="100%" />}
          </PoolsFilterPanel>
        </CardHeader>
        <CardBody>
          {isReady && (
            <Suspense fallback={null}>
              <List />
            </Suspense>
          )}
        </CardBody>
      </Card>
    </FarmSearchContextProvider>
  )
}

const List = () => {
  const nextRouter = useRouter()
  const { isMobile } = useMatchBreakpoints()

  const columns = useColumnConfig()

  const query = useAtomValue(searchQueryAtom)
  const updateSort = useSetAtom(updateSortAtom)
  const { observerRef, isIntersecting } = useIntersectionObserver()

  useEffect(() => {
    const params = farmQueryToUrlParams(query)
    nextRouter.replace({
      pathname: nextRouter.pathname,
      query: params,
    })
  }, [query])

  const handleRowClick = useCallback(
    async (pool: PoolInfo) => {
      const data = await getPoolDetailPageLink(pool)
      nextRouter.push(data)
    },
    [nextRouter],
  )

  const getRowKey = useCallback((item: PoolInfo) => {
    const farm = item.farm!
    return getFarmKey(farm)
  }, [])

  const setPaging = useSetAtom(farmsSearchPagingAtom(query))
  const _list = useAtomValue(farmsSearchAtom(query))
  const handleSort = useCallback(
    ({ order, dataIndex }) => {
      updateSort({
        order,
        dataIndex,
      })
    },
    [query],
  )

  useEffect(() => {
    if (isIntersecting) {
      setPaging((v) => v + 1)
    }
  }, [isIntersecting, setPaging])

  const list = _list.unwrapOr([])
  const pending = _list.isPending() && list.length === 0

  return (
    <>
      <PoolsContent
        style={{
          opacity: _list.isPending() ? 0.2 : 1,
        }}
      >
        {!pending && (
          <>
            {isMobile ? (
              <ListView data={list} onRowClick={handleRowClick} />
            ) : (
              <TableView
                getRowKey={getRowKey}
                columns={columns}
                data={list}
                onSort={handleSort}
                sortOrder={query.sortOrder}
                sortField={query.sortBy}
                onRowClick={handleRowClick}
              />
            )}
          </>
        )}
        {pending && (
          <StyledLoadingTable justifyContent="center" alignItems="center">
            <Spinner />
          </StyledLoadingTable>
        )}
      </PoolsContent>
      {list.length > 0 && <div ref={observerRef} />}
    </>
  )
}

const StyledLoadingTable = styled(Flex)`
  padding-top: 40px
  maxheight: 100%;
`
