import { useTranslation } from '@pancakeswap/localization'
import { Button, FlexGap, InjectedModalProps, Modal, ModalBody, SwapLoading, Text } from '@pancakeswap/uikit'
import { TransactionList } from '@pancakeswap/widgets-internal'
import isEmpty from 'lodash/isEmpty'
import { useCallback, useMemo } from 'react'
import { useAppDispatch } from 'state'
import { useAllSortedRecentTransactions } from 'state/transactions/hooks'
import { TransactionDetails } from 'state/transactions/reducer'
import { chains } from 'utils/wagmi'
import { useRecentXOrders } from 'views/Swap/x/useRecentXOders'

import { clearAllTransactions } from 'state/transactions/actions'
import { useRecentBridgeOrders } from 'views/Swap/Bridge/hooks/useRecentBridgeOrders'
import { useAccount } from 'wagmi'

import ConnectWalletButton from '../../ConnectWalletButton'
import { AutoRow } from '../../Layout/Row'
import { CrossChainTransaction } from './CrossChainTransaction'
import Transaction from './Transaction'
import { XTransaction } from './XTransaction'
import { CrossChainTransactionItem, TransactionItem, XTransactionItem } from './types'

function getTransactionTimestamp(item: TransactionItem): number {
  switch (item.type) {
    case 'tx':
      return item.item.addedTime
    case 'xOrder':
      return new Date(item.item.createdAt).getTime()
    case 'crossChainOrder':
      return new Date(item.order.timestamp).getTime()
    default:
      return 0
  }
}

function sortByTransactionTime(a: TransactionItem, b: TransactionItem) {
  const timeA = getTransactionTimestamp(a)
  const timeB = getTransactionTimestamp(b)
  return timeB - timeA
}

export function RecentTransactions() {
  const { address: account, chainId } = useAccount()
  const dispatch = useAppDispatch()

  const { data: recentXOrders } = useRecentXOrders({
    chainId,
    address: account,
    refetchInterval: 10_000,
  })

  // Cross-Chain Orders
  const {
    data: crossChainOrdersResponse,
    isFetching: isRecentBridgeOrdersLoading,
    fetchNextPage,
  } = useRecentBridgeOrders({
    address: account,
  })

  const hasMoreCrossChainOrders = Boolean(
    crossChainOrdersResponse?.pages[crossChainOrdersResponse.pages.length - 1].hasNextPage,
  )

  const recentCrossChainOrders: CrossChainTransactionItem[] =
    crossChainOrdersResponse?.pages.flatMap(
      (page) =>
        page?.rows.map(
          (order): CrossChainTransactionItem => ({
            type: 'crossChainOrder',
            order,
          }),
        ) ?? [],
    ) ?? []

  const sortedRecentTransactions = useAllSortedRecentTransactions()

  const xOrders: XTransactionItem[] = useMemo(
    () => recentXOrders?.orders.reverse().map((order) => ({ type: 'xOrder', item: order })) ?? [],
    [recentXOrders],
  )

  const { t } = useTranslation()

  const hasTransactions = !isEmpty(sortedRecentTransactions)

  const clearAllTransactionsCallback = useCallback(() => {
    dispatch(clearAllTransactions())
  }, [dispatch])

  const recentTransactionsHeading = useMemo(() => {
    return (
      <FlexGap alignItems="center" gap="8px">
        <Text color="secondary" fontSize="12px" textTransform="uppercase" bold>
          {t('Recent Transactions')}
        </Text>
        {isRecentBridgeOrdersLoading && <SwapLoading />}
      </FlexGap>
    )
  }, [t, isRecentBridgeOrdersLoading])

  return (
    <>
      {account ? (
        xOrders.length > 0 || hasTransactions || recentCrossChainOrders.length > 0 ? (
          <>
            <AutoRow mb="1rem" style={{ justifyContent: 'space-between' }} onClick={(e) => e.stopPropagation()}>
              {recentTransactionsHeading}
              {hasTransactions && (
                <Button variant="tertiary" scale="xs" onClick={clearAllTransactionsCallback}>
                  {t('clear all')}
                </Button>
              )}
            </AutoRow>
            {hasTransactions ? (
              Object.entries(sortedRecentTransactions).map(([chainId_, transactions]) => {
                const chainIdNumber = Number(chainId_)
                const content = (
                  <UnifiedTransactionList
                    transactions={Object.values(transactions)}
                    xOrders={chainIdNumber === chainId ? xOrders : undefined}
                    crossChainOrders={recentCrossChainOrders}
                    chainId={chainIdNumber}
                  />
                )

                return (
                  <div key={`transactions#${chainIdNumber}`}>
                    <AutoRow mb="1rem" style={{ justifyContent: 'space-between' }}>
                      <Text fontSize="12px" color="textSubtle" mb="4px">
                        {chains.find((c) => c.id === chainIdNumber)?.name ?? 'Unknown network'}
                      </Text>
                    </AutoRow>
                    {content}
                  </div>
                )
              })
            ) : (
              <UnifiedTransactionList xOrders={xOrders} crossChainOrders={recentCrossChainOrders} chainId={chainId} />
            )}
            {hasMoreCrossChainOrders && (
              <Button
                variant="text"
                scale="sm"
                mt="16px"
                disabled={isRecentBridgeOrdersLoading}
                onClick={() => fetchNextPage()}
              >
                {isRecentBridgeOrdersLoading ? t('Loading...') : t('Load More')}
              </Button>
            )}
          </>
        ) : (
          <>
            {recentTransactionsHeading}
            <Text mt="8px">{t('No recent transactions')}</Text>
          </>
        )
      ) : (
        <ConnectWalletButton />
      )}
    </>
  )
}

const TransactionsModal: React.FC<React.PropsWithChildren<InjectedModalProps>> = ({ onDismiss }) => {
  const { t } = useTranslation()

  return (
    <Modal title={t('Recent Transactions')} headerBackground="gradientCardHeader" onDismiss={onDismiss}>
      <ModalBody>
        <RecentTransactions />
      </ModalBody>
    </Modal>
  )
}

function UnifiedTransactionList({
  transactions,
  xOrders = [],
  chainId,
  crossChainOrders = [],
}: {
  transactions?: TransactionDetails[]
  xOrders?: TransactionItem[]
  chainId?: number
  crossChainOrders?: TransactionItem[]
}) {
  const allTransactionItems = useMemo(
    () =>
      [
        ...(transactions || []).map(
          (t) =>
            ({
              type: 'tx',
              item: t,
            } as TransactionItem),
        ),
        ...crossChainOrders,
        ...xOrders,
      ].sort(sortByTransactionTime),
    [transactions, xOrders, crossChainOrders],
  )

  if (!chainId) {
    return null
  }

  return (
    <TransactionList>
      {allTransactionItems.map((tx) => {
        if (tx.type === 'tx') {
          return <Transaction key={tx.item.hash + tx.item.addedTime} tx={tx.item} chainId={chainId} />
        }
        if (tx.type === 'crossChainOrder') {
          return <CrossChainTransaction key={tx.order.orderId} order={tx.order} />
        }
        return <XTransaction key={tx.item.hash} order={tx.item} />
      })}
    </TransactionList>
  )
}

export default TransactionsModal
