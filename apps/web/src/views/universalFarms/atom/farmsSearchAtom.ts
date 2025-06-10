import { ChainId, isTestnetChainId } from '@pancakeswap/chains'
import { supportedChainIdV4 } from '@pancakeswap/farms'
import { getCurrencyAddress, Native, ZERO_ADDRESS } from '@pancakeswap/sdk'
import { SmartRouter } from '@pancakeswap/smart-router'
import { TokenInfo } from '@pancakeswap/token-lists'
import { Loadable } from '@pancakeswap/utils/Loadable'
import uniqBy from '@pancakeswap/utils/uniqBy'
import { atom } from 'jotai'
import { atomFamily } from 'jotai/utils'
import isEqual from 'lodash/isEqual'
import keyBy from 'lodash/keyBy'
import qs from 'qs'
import { atomWithLoadable } from 'quoter/atom/atomWithLoadable'
import { Protocol } from 'quoter/utils/edgeQueries.util'
import {
  batchGetCakeApr,
  batchGetLpAprData,
  batchGetMerklAprData,
  fillOnchainPoolData,
} from 'state/farmsV4/search/batchFarmDataFiller'
import { FarmQuery } from 'state/farmsV4/search/edgeFarmQueries'
import { FarmInfo, farmToPoolInfo, getFarmKey, SerializedFarmInfo } from 'state/farmsV4/search/farm.util'
import { farmFilters } from 'state/farmsV4/search/filters'
import { PoolInfo } from 'state/farmsV4/state/type'
import { listsAtom, tokenBySymbolAtom } from 'state/lists/lists'
import { userShowTestnetAtom } from 'state/user/hooks/useUserShowTestnet'
import { Address } from 'viem/accounts'

async function fetchFarmList({
  extend = false,
  protocols,
  address,
  chains,
}: {
  extend?: boolean
  protocols?: Protocol[]
  address?: string
  chains?: ChainId[]
}) {
  const queryStr = qs.stringify({
    extend: extend ? 1 : undefined,
    protocols: protocols ? protocols.join(',') : undefined,
    address,
    chains: chains?.join(','),
  })
  const api = `${process.env.NEXT_PUBLIC_EDGE_ENDPOINT || ''}/api/farm/list?${queryStr}`
  const response = await fetch(api, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  if (!response.ok) {
    throw new Error(`Failed to fetch farms: ${response.statusText}`)
  }
  const resp = (await response.json()) as {
    data: SerializedFarmInfo[]
    lastUpdated: number
  }
  return resp.data
}

const farmListAtom = atomWithLoadable<SerializedFarmInfo[]>(async () => {
  return fetchFarmList({
    extend: false,
  })
})

const extendListAtom = atomFamily((params: { protocols: Protocol[]; chains: ChainId[]; address?: string }) => {
  const { protocols, address, chains } = params
  return atomWithLoadable<SerializedFarmInfo[]>(async () => {
    return fetchFarmList({
      extend: true,
      protocols,
      address,
      chains,
    })
  })
}, isEqual)

export const farmsSearchPagingAtom = atomFamily((_: FarmQuery) => {
  return atom(0)
}, isEqual)

const IS_ADDRESS_REG = /^0x[a-fA-F0-9]{40,64}$/

const getTokenBySymbolAtom = atomFamily((params: { chainId: ChainId; symbol: string }) => {
  return atomWithLoadable<Address>(async (get) => {
    const { chainId, symbol } = params
    let attempt = 0

    while (attempt < 5) {
      const isNative = Native.onChain(chainId).symbol.toLowerCase() === symbol.toLowerCase()
      if (isNative) {
        return Loadable.Just(ZERO_ADDRESS)
      }
      const token: TokenInfo | undefined = get(
        tokenBySymbolAtom({
          symbol,
          chainId,
        }),
      )

      if (token !== undefined) return Loadable.Just(token.address)
      attempt += 1
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
    return Loadable.Nothing()
  })
}, isEqual)

const searchAtom = atomFamily((query: FarmQuery) => {
  return atom((get) => {
    const { protocols, chains: _chains, sortBy, activeChainId, keywords } = query
    const useShowTestnet = get(userShowTestnetAtom)
    const { tokensMap, symbolsMap } = get(tokensMapAtom)
    const chains = _chains.filter((chain) => {
      if (isTestnetChainId(chain) && !useShowTestnet) {
        return false
      }
      return true
    })

    const lists = [get(farmListAtom)]
    if (activeChainId) {
      const prts = keywords
        .trim()
        .split(/(\s+|,|-|\/)/)
        .map((x) => x.trim())
        .filter((x) => x)
        .slice(0, 3) // max 3
      // Extend Symbol if Required

      for (const prt of prts) {
        const relatedTokens = symbolsMap[prt.toLowerCase()]
        if (relatedTokens) {
          for (const token of relatedTokens) {
            if (supportedChainIdV4.includes(token.chainId)) {
              const extendToken = get(
                extendListAtom({
                  protocols,
                  chains: [token.chainId],
                  address: token.address,
                }),
              )
              lists.push(extendToken)
            }
          }
        }
      }

      if (IS_ADDRESS_REG.test(keywords.trim())) {
        lists.push(
          get(
            extendListAtom({
              protocols,
              address: keywords.trim(),
              chains: [activeChainId],
            }),
          ),
        )
      }

      // default extend for active chain
      lists.push(
        get(
          extendListAtom({
            protocols,
            chains: [activeChainId],
          }),
        ),
      )
    }

    const farms = uniqBy(
      lists
        .filter((x) => x.hasValue())
        .map((x) => x.unwrapOr([]))
        .flat(),
      (item) => `${item.chainId}:${item.id}`.toLowerCase(),
    ).map((farm) => {
      const { pool, chainId, vol24hUsd, ...rest } = farm
      const farmInfo = {
        chainId: farm.chainId,
        tvlUsd: 0,
        ...rest,
        feeTierBase: 1e6,
        vol24hUsd: farm.vol24hUsd,
        pool: SmartRouter.Transformer.parsePool(farm.chainId, farm.pool),
      } as FarmInfo

      return farmInfo
    })

    const filtered = farmFilters.search(
      farms
        .filter(farmFilters.chainFilter(chains))
        .filter(farmFilters.protocolFilter(protocols))
        .filter(filterTokens(tokensMap)),
      query.keywords,
    )
    const sorted = farmFilters.sortFunction(filtered, sortBy, activeChainId)

    const hasPending = lists.some((x) => x.isPending())

    if (hasPending) {
      return Loadable.Pending(sorted)
    }
    return Loadable.Just(sorted)
  })
}, isEqual)

const farmsWithPagingAtom = atomFamily((query) => {
  return atomWithLoadable(async (get) => {
    const sorted = get(searchAtom(query))
    const paging = get(farmsSearchPagingAtom(query))
    const r = await sorted.mapAsync(async (farms) => {
      const sliced = farms.slice(0, 20 * (paging + 1))

      const filled = await Promise.all(sliced.map(fillOnchainPoolData))
      return filled.map((x) => {
        return farmToPoolInfo(x)
      })
    })
    return r
  })
}, isEqual)

const farmsWithFilledDataAtom = atomFamily((query) => {
  return atomWithLoadable(
    async (get) => {
      const sliced = get(farmsWithPagingAtom(query))

      return sliced.mapAsync(async (poolInfos) => {
        const [cakeAprs, lpAprs, merklAprs] = await Promise.allSettled([
          batchGetCakeApr(poolInfos),
          batchGetLpAprData(poolInfos),
          batchGetMerklAprData(poolInfos),
        ])

        const aggCakeAprs = keyBy(cakeAprs.status === 'fulfilled' ? cakeAprs.value : [], (x) => x.id.toLowerCase())
        const aggLpAprs = keyBy(lpAprs.status === 'fulfilled' ? lpAprs.value : [], (x) => x.id.toLowerCase())
        const aggMerklAprs = keyBy(merklAprs.status === 'fulfilled' ? merklAprs.value : [], (x) => x.id.toLowerCase())

        return poolInfos.map((poolInfo) => {
          const { farm, ...others } = poolInfo
          const id = getFarmKey(farm!)
          const cakeApr = aggCakeAprs[id]?.value || '0'
          const lpApr = `${aggLpAprs[id]?.value || farm?.apr24h || '0'}`
          const merklApr = aggMerklAprs[id]?.value || '0'

          return {
            ...others,
            farm: {
              ...farm,
              cakeApr,
              lpApr,
              merklApr,
            },
            lpApr,
          } as PoolInfo
        })
      })
    },
    {
      placeHolderBehavior: 'stale',
    },
  )
}, isEqual)

export const farmsSearchAtom = atomFamily((query) => {
  return atom((get) => {
    const sliced = get(farmsWithPagingAtom(query))
    const withFilledData = get(farmsWithFilledDataAtom(query))

    if (withFilledData.isPending()) {
      return sliced
    }
    return withFilledData
  })
}, isEqual)

const filterTokens = (tokensMap: Record<string, TokenInfo>) => {
  return (farm: FarmInfo) => {
    const [token0, token1] = SmartRouter.getCurrenciesOfPool(farm.pool)
    if (!token0 || !token1) return false
    const key0 = `${token0.chainId}:${getCurrencyAddress(token0)}`.toLowerCase()
    const key1 = `${token0.chainId}:${getCurrencyAddress(token1)}`.toLowerCase()

    if (!tokensMap[key0] || !tokensMap[key1]) {
      return false
    }
    return true
  }
}

const tokensMapAtom = atom((get) => {
  const state = get(listsAtom)

  const records: Record<string, TokenInfo> = {}
  const symbols: Record<string, TokenInfo[]> = {}
  Object.keys(state.byUrl).forEach((url) => {
    const list = state.byUrl[url]
    if (list.current) {
      list.current.tokens.forEach((token) => {
        records[`${token.chainId}:${token.address}`.toLowerCase()] = token
        if (!symbols[token.symbol.toLowerCase()]) {
          symbols[token.symbol.toLowerCase()] = []
        }
        const tokens = symbols[token.symbol.toLowerCase()]
        if (!tokens.find((x) => x.chainId === token.chainId && x.address === token.address)) {
          tokens.push(token)
        }
      })
    }
  })
  return {
    tokensMap: records,
    symbolsMap: symbols,
  }
})
