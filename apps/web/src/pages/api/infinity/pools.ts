import BN from 'bignumber.js'
import { NextRequest, NextResponse } from 'next/server'
import qs from 'qs'

export const config = {
  runtime: 'edge',
}

const MAX_CACHE_SECONDS = 60 * 60

export default async function handler(req: NextRequest) {
  const raw = new URL(req.url).search.slice(1)
  if (!raw) {
    return NextResponse.json({ error: 'Invalid query' }, { status: 400 })
  }
  const queryParsed = qs.parse(raw)
  const _protocol = queryParsed.protocol
  const protocols =
    typeof _protocol === 'string' ? [_protocol] : Array.isArray(_protocol) ? (_protocol as string[]) : undefined
  const chain = queryParsed.chain
  const supported = ['infinityCl', 'infinityBin']
  const valid = protocols && protocols.every((p) => supported.includes(p))
  if (!valid) {
    return NextResponse.json({ error: 'Invalid protocol or chain' }, { status: 400 })
  }

  try {
    // eslint-disable-next-line no-await-in-loop
    const pools = await fetchAllPools({
      baseUrl: 'https://explorer.pancakeswap.com/api/cached/pools/list',
      protocols: protocols as ('infinityBin' | 'infinityCl')[],
      chains: [chain as any],
    })

    const result = pools.map((p) => ({
      id: p.id,
      tvlUSD: new BN(p.tvlUSD).decimalPlaces(0, BN.ROUND_CEIL).toString(),
    }))

    return NextResponse.json(
      {
        data: result,
        lastUpdated: Number(Date.now()),
      },
      {
        status: 200,
        headers: {
          'Cache-Control': `max-age=${MAX_CACHE_SECONDS}, s-maxage=${MAX_CACHE_SECONDS}`,
          'Content-Type': 'application/json',
        },
      },
    )
  } catch (err) {
    return NextResponse.json({ error: `${err}` }, { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}

type PaginatedResponse = {
  startCursor?: string
  endCursor?: string
  hasNextPage: boolean
  hasPrevPage: boolean
  rows: Pool[]
}

type Pool = {
  id: string
  chainId: number
  token0Price: string
  token1Price: string
  tvlToken0: string
  tvlToken1: string
  tvlUSD: string
  volumeUSD24h: string
  apr24h: string
  protocol: 'v2' | 'v3' | 'infinityBin' | 'infinityCl' | 'stable'
  feeTier: number
  token0: Token
  token1: Token
  isDynamicFee?: boolean
  hookAddress?: string | null
}

type Token = {
  id: string
  symbol: string
  name: string
  decimals: number
}

type FetchAllPoolsParams = {
  baseUrl: string
  orderBy?: 'tvlUSD' | 'volumeUSD24h' | 'apr24h'
  protocols: Array<'v2' | 'v3' | 'infinityBin' | 'infinityCl' | 'stable'>
  chains: Array<
    'bsc' | 'bsc-testnet' | 'ethereum' | 'base' | 'opbnb' | 'zksync' | 'polygon-zkevm' | 'linea' | 'arbitrum'
  >
  pools?: string[]
  tokens?: string[]
  pageSize?: number
  maxPages?: number // Optional safety limit for maximum pages to fetch
}

/**
 * Fetches all data from a paginated API endpoint
 * @param params Configuration parameters for the fetch operation
 * @returns Promise resolving to an array of all pools
 */
async function fetchAllPools({
  baseUrl,
  orderBy = 'tvlUSD',
  protocols,
  chains,
  pools = [],
  tokens = [],
  pageSize = 100,
  maxPages = Infinity,
}: FetchAllPoolsParams): Promise<Pool[]> {
  const allResults: Pool[] = []
  let cursor: string | null = null
  let hasNextPage = true
  let pageCount = 0

  // Construct the base URL params
  const buildUrlParams = (after?: string) => {
    const params = new URLSearchParams()

    // Add required parameters
    params.append('orderBy', orderBy)

    // Add protocols
    protocols.forEach((protocol) => {
      params.append('protocols', protocol)
    })

    // Add chains if tokens are not specified
    if (tokens.length === 0) {
      chains.forEach((chain) => {
        params.append('chains', chain)
      })
    }

    // Add pools if specified
    pools.forEach((pool) => {
      params.append('pools', pool)
    })

    // Add tokens if specified
    tokens.forEach((token) => {
      params.append('tokens', token)
    })

    // Add pagination parameters
    if (after) {
      params.append('after', after)
    }

    // Add page size
    params.append('limit', pageSize.toString())

    return params.toString()
  }

  while (hasNextPage && pageCount < maxPages) {
    const url = `${baseUrl}?${buildUrlParams(cursor || undefined)}`

    try {
      // eslint-disable-next-line no-await-in-loop
      const response = await fetch(url, {
        headers: {
          'x-api-key': process.env.EXPLORER_API_KEY || '',
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`)
      }

      // eslint-disable-next-line no-await-in-loop
      const data: PaginatedResponse = await response.json()

      // Add the current page of results
      allResults.push(...data.rows)

      // Update for next iteration
      hasNextPage = data.hasNextPage
      cursor = data.endCursor || null
      pageCount++
    } catch (error) {
      console.error('Error fetching data:', error)
      throw error
    }
  }

  if (pageCount >= maxPages && hasNextPage) {
    console.warn(`Reached maximum page limit of ${maxPages}. Some data may not have been fetched.`)
  }

  return allResults
}
