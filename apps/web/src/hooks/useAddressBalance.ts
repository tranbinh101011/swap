import { ChainId } from '@pancakeswap/chains'
import { useQuery } from '@tanstack/react-query'
import BigNumber from 'bignumber.js'
import { useCallback, useMemo } from 'react'

export interface TokenData {
  address: string
  name: string
  symbol: string
  decimals: number
  isSpam: boolean
  logoURI?: string
}

export interface PriceData {
  totalUsd: number | null
  usd: number | null
  usd24h: number | null
}

export interface BalanceData {
  id: string
  chainId: number
  timestamp: string
  value: string
  quantity: string
  token: TokenData
  price: PriceData | null
}

interface UseAddressBalanceOptions {
  includeSpam?: boolean
  onlyWithPrice?: boolean
  filterByChainId?: ChainId | number
  enabled?: boolean
}

const API_BASE_URL = process.env.NEXT_PUBLIC_WALLET_API_BASE_URL || 'https://wallet-api.pancakeswap.com/v1/balances'

/**
 * Hook to fetch and manage token balances for a specific address using React Query
 */
export const useAddressBalance = (address?: string, options: UseAddressBalanceOptions = {}) => {
  const { includeSpam = false, onlyWithPrice = false, filterByChainId, enabled = true } = options

  // Fetch balances from the API
  const fetchBalances = useCallback(async (): Promise<BalanceData[]> => {
    if (!address) return []

    const response = await fetch(`${API_BASE_URL}/${address}`)

    if (!response.ok) {
      throw new Error(`Error fetching balances: ${response.statusText}`)
    }

    const data = (await response.json()) || []

    // TODO: remove this, mock data
    data.push(
      {
        id: '97-0x0000000000000000000000000000000000000000-0x9d24d495f7380ba80dc114d8c2cf1a54a68e25a4',
        quantity: '100',
        timestamp: '2025-07-01T20:57:14.404Z',
        value: '1000000000000000000',
        chainId: 97,
        token: {
          decimals: 18,
          name: 'BNB',
          symbol: 'BNB',
          address: '0x0000000000000000000000000000000000000000',
          logoURI: 'https://assets.pancakeswap.finance/web/native/56.png',
          isSpam: false,
        },
        price: { totalUsd: 1000, usd: 1000, usd24h: 1000 },
      },
      {
        id: '97-0x8d008B313C1d6C7fE2982F62d32Da7507cF43551-0x9d24d495f7380ba80dc114d8c2cf1a54a68e25a4',
        quantity: '100',
        timestamp: '2025-07-01T20:57:14.404Z',
        value: '1000000000000000000',
        chainId: 97,
        token: {
          decimals: 18,
          name: 'CAKE',
          symbol: 'CAKE',
          address: '0x8d008B313C1d6C7fE2982F62d32Da7507cF43551',
          logoURI: 'https://assets.pancakeswap.finance/web/native/56.png',
          isSpam: false,
        },
        price: { totalUsd: 1000, usd: 1000, usd24h: 1000 },
      },
    )

    return data
  }, [address])

  const {
    data: balances = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['addressBalances', address],
    queryFn: fetchBalances,
    enabled: Boolean(address) && enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  })

  // Filter balances based on options
  const filteredBalances = useMemo(() => {
    return balances.filter((balance) => {
      // Filter out spam tokens if includeSpam is false
      if (!includeSpam && balance.token.isSpam) {
        return false
      }

      // Filter by chain ID if specified
      if (filterByChainId !== undefined && balance.chainId !== filterByChainId) {
        return false
      }

      // Filter out tokens without price data if onlyWithPrice is true
      if (onlyWithPrice && !balance.price?.usd) {
        return false
      }

      return true
    })
  }, [balances, includeSpam, filterByChainId, onlyWithPrice])

  // Calculate total balance in USD for all tokens
  const totalBalanceUsd = useMemo(() => {
    return balances.reduce((sum, item) => {
      if (item.price?.totalUsd) {
        return sum + item.price.totalUsd
      }
      return sum
    }, 0)
  }, [balances])

  // Calculate total balance in USD for filtered tokens
  const filteredTotalBalanceUsd = useMemo(() => {
    return filteredBalances.reduce((sum, item) => {
      if (item.price?.totalUsd) {
        return sum + item.price.totalUsd
      }
      return sum
    }, 0)
  }, [filteredBalances])

  // Get balances for a specific chain
  const getBalancesByChain = useCallback(
    (chainId: ChainId | number) => {
      return filteredBalances.filter((balance) => balance.chainId === chainId)
    },
    [filteredBalances],
  )

  // Get the top balances by USD value
  const getTopBalances = useCallback(
    (limit: number = 5) => {
      return [...filteredBalances]
        .filter((balance) => balance.price?.totalUsd)
        .sort((a, b) => {
          const aValue = a.price?.totalUsd || 0
          const bValue = b.price?.totalUsd || 0
          return bValue - aValue
        })
        .slice(0, limit)
    },
    [filteredBalances],
  )

  // Get native token balance for a specific chain
  const getNativeBalance = useCallback(
    (chainId: ChainId | number) => {
      return filteredBalances.find(
        (balance) =>
          balance.chainId === chainId && balance.token.address === '0x0000000000000000000000000000000000000000',
      )
    },
    [filteredBalances],
  )

  // Get token balance by token address and chain
  const getTokenBalance = useCallback(
    (tokenAddress: string, chainId: ChainId | number) => {
      return filteredBalances.find(
        (balance) => balance.chainId === chainId && balance.token.address.toLowerCase() === tokenAddress.toLowerCase(),
      )
    },
    [filteredBalances],
  )

  // Get balance in BigNumber format with proper decimals
  const getBalanceAmount = useCallback((balance: BalanceData) => {
    return new BigNumber(balance.value).shiftedBy(-balance.token.decimals)
  }, [])

  return {
    balances: filteredBalances,
    isLoading,
    error,
    totalBalanceUsd: filteredTotalBalanceUsd,
    allTokensUsdValue: totalBalanceUsd,
    refresh: refetch,
    getBalancesByChain,
    getTopBalances,
    getNativeBalance,
    getTokenBalance,
    getBalanceAmount,
  }
}

export default useAddressBalance
