import { ChainId } from '@pancakeswap/chains'
import { Protocol } from '@pancakeswap/farms'
import { Native } from '@pancakeswap/sdk'
import { PoolType, SmartRouter } from '@pancakeswap/smart-router'
import { getCurrencyAddress } from '@pancakeswap/swap-sdk-core'
import latinise from '@pancakeswap/utils/latinise'
import { PoolInfo } from 'state/farmsV4/state/type'
import { getCurrencySymbol } from 'utils/getTokenAlias'
import { FarmInfo } from './farm.util'

const chainFilter = (chains: ChainId[]) => {
  return (farm: FarmInfo): boolean => {
    if (!chains || chains.length === 0) return true
    const { chainId } = farm
    if (chains.indexOf(chainId) === -1) {
      return false
    }
    return true
  }
}

const protocolFilter = (protocols: Protocol[]) => {
  return (farm: FarmInfo): boolean => {
    if (!protocols || protocols.length === 0) return true
    if (protocols.indexOf(farm.protocol as Protocol) !== -1) {
      return true
    }
    return false
  }
}

function getAllPairs(A: string[], B: string[]): [string, string][] {
  const pairs: [string, string][] = []

  A.forEach((a) => {
    B.forEach((b) => {
      pairs.push([a, b], [b, a])
    })
  })

  return pairs
}

const search = (farms: FarmInfo[], search: string): FarmInfo[] => {
  if (!search) {
    return farms
  }
  const filter = searchFilter(search)
  const filterResults = farms.map((x) => filter(x))
  const fullMatches = filterResults.filter((x) => x.full).map((x) => x.farm)
  if (fullMatches.length > 0) {
    return fullMatches
  }
  const partialMatch = filterResults.filter((x) => x.partial).map((x) => x.farm)
  return partialMatch
}

const searchFilter = (_search: string) => {
  return (
    farm: FarmInfo,
  ): {
    full: boolean
    partial: boolean
    farm: FarmInfo
  } => {
    if (!_search || _search.trim() === '')
      return {
        full: false,
        partial: false,
        farm,
      }
    const search = _search.toLowerCase().trim()

    const [token0, token1] = SmartRouter.getCurrenciesOfPool(farm.pool)
    const isAddress = Boolean(search.match(/^0x[a-z0-9]+$/))
    if (isAddress) {
      const list = [
        farm.id.toLowerCase(),
        getCurrencyAddress(token0).toLowerCase(),
        getCurrencyAddress(token1).toLowerCase(),
      ]
      return {
        full: list.some((item) => item.startsWith(search)),
        partial: false,
        farm,
      }
    }

    const { pool } = farm

    // Token0 handling
    const symbol0List: string[] = []
    symbol0List.push(getCurrencySymbol(token0).toLowerCase())
    if (token0.isNative && token0.wrapped?.symbol) {
      symbol0List.push(getCurrencySymbol(token0.wrapped).toLowerCase())
    } else if (Native.onChain(farm.chainId).wrapped.equals(token0)) {
      symbol0List.push(getCurrencySymbol(Native.onChain(farm.chainId)).toLowerCase())
    }

    // Token1 handling
    const symbol1List: string[] = []
    symbol1List.push(getCurrencySymbol(token1).toLowerCase())
    if (token1.isNative) {
      symbol1List.push(getCurrencySymbol(token1.wrapped).toLowerCase())
    } else if (Native.onChain(farm.chainId).wrapped.equals(token1)) {
      symbol1List.push(getCurrencyAddress(Native.onChain(farm.chainId)).toLowerCase())
    }
    const pairs = getAllPairs(symbol0List, symbol1List)

    const clamm = pool.type === PoolType.InfinityCL ? 'clamm' : ''
    const lbamm = pool.type === PoolType.InfinityBIN ? 'lbamm' : ''
    const isInfinity = pool.type === PoolType.InfinityCL || pool.type === PoolType.InfinityBIN
    const dynamic = isInfinity && farm.isDynamicFee
    const infinity = isInfinity ? 'infinity' : ''
    const stable = pool.type === PoolType.STABLE ? 'stable' : ''
    const v2 = pool.type === PoolType.V2 ? 'v2' : ''
    const v3 = pool.type === PoolType.V3 ? 'v3' : ''

    const tags = [
      ...symbol0List,
      ...symbol1List,
      ...pairs.map((x) => {
        return `${x[0]}/${x[1]}`
      }),
      clamm,
      lbamm,
      dynamic ? 'dynamic' : '',
      infinity,
      stable,
      v2,
      v3,
    ]
      .filter((x) => x)
      .map((x) => latinise(x))
      .map((x) => x.toLowerCase())
    const prts = search
      .split(/[\s,]/g)
      .filter((x) => x.trim())
      .filter((x) => x)

    const erveryMatched = prts.every((prt) => {
      return tags.some((tag) => tag.startsWith(prt))
    })
    const someMatched = prts.some((prt) => {
      return tags.some((tag) => tag.startsWith(prt))
    })
    return {
      full: erveryMatched,
      partial: someMatched,
      farm,
    }
  }
}

function createSigmoid(k: number = 0.1) {
  return function sigmoidNormalize(value: number, avg: number): number {
    const exp = Math.exp(-k * (value - avg))
    return 100 / (1 + exp)
  }
}

const sigmoidTvl = createSigmoid(0.00001)
const sigmoidApr = createSigmoid(0.1)
const sigmoidVol = createSigmoid(0.0001)

interface Weighted<T> {
  item: T
  weight: number
}

const sortFunction = (farms: FarmInfo[], sortField: keyof PoolInfo | null, activeChainId?: ChainId) => {
  if (farms.length === 0) return []
  const order = 1

  switch (sortField) {
    case 'tvlUsd': {
      farms.sort((a, b) => Number(b.tvlUSD) - Number(a.tvlUSD))
      return farms
    }
    case 'lpApr': {
      farms.sort((a, b) => order * ((b.apr24h || 0) - (a.apr24h || 0)))
      return farms
    }
    case 'vol24hUsd': {
      farms.sort((a, b) => order * (Number(b.vol24hUsd || 0) - Number(a.vol24hUsd || 0)))
      return farms
    }
    default:
  }
  const avgTvl = farms.reduce((sum, farm) => sum + Number(farm.tvlUSD || 0), 0) / farms.length
  const avgApr = farms.reduce((sum, farm) => sum + (farm.apr24h || 0), 0) / farms.length
  const avgVol = farms.reduce((sum, farm) => sum + Number(farm.vol24hUsd || 0), 0) / farms.length

  const weight = (farm: FarmInfo) => {
    const tvlWeight = sigmoidTvl(Number(farm.tvlUSD || 0), avgTvl)
    const aprWeight = sigmoidApr(Number(farm.apr24h || 0), avgApr)
    const volWeight = sigmoidVol(Number(farm.vol24hUsd || 0), avgVol)
    const sameChain = farm.chainId === activeChainId ? 1 : 0
    const w = aprWeight * 0.1 + tvlWeight * 0.3 + volWeight * 0.6 // Adjust weights as needed

    return w * 0.2 + sameChain * 80 // Boost weight for active chain
  }

  const weightedFarms: Weighted<FarmInfo>[] = farms.map((farm) => ({
    weight: weight(farm),
    item: farm,
  }))

  weightedFarms.sort((a, b) => order * (b.weight - a.weight)) // sort by max weight
  return weightedFarms.map((x) => x.item)
}

export const farmFilters = {
  chainFilter,
  protocolFilter,
  sortFunction,
  search,
}
