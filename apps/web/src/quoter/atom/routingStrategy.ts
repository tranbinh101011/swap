import { SimpleCache } from '@pancakeswap/utils/SimpleCache'
import { Atom } from 'jotai'
import { AtomFamily } from 'jotai/vanilla/utils/atomFamily'
import { QuoteQuery } from 'quoter/quoter.types'
import { InterfaceOrder } from 'views/Swap/utils'
import { Loadable } from './atomWithLoadable'
import { bestAMMTradeFromOffchainQuoterAtom } from './bestAMMTradeFromOffchainQuoterAtom'
import { bestAMMTradeFromQuoterWorkerAtom } from './bestAMMTradeFromQuoterWorkerAtom'
import { bestXApiAtom } from './bestXAPIAtom'

type AtomType = AtomFamily<QuoteQuery, Atom<Loadable<InterfaceOrder | undefined>>>
export interface StrategyRoute {
  query: AtomType
  overrides: Partial<QuoteQuery>
}
type RoutingStrategy = StrategyRoute[][]

const cache = new SimpleCache<string, RoutingStrategy>({
  maxSize: 1000,
  maxAge: 1000 * 120, // 2 minites
})

const defaultRoutingStrategy: RoutingStrategy = [
  [
    // Single hop route
    {
      query: bestAMMTradeFromQuoterWorkerAtom,
      overrides: {
        maxHops: 1,
        maxSplits: 0,
        enabled: true,
      },
    },
    // #2 v2,v3,ss
    {
      query: bestAMMTradeFromOffchainQuoterAtom,
      overrides: {
        infinitySwap: false,
      },
    },
    // #3 infinity only
    {
      query: bestAMMTradeFromOffchainQuoterAtom,
      overrides: {
        v2Swap: false,
        stableSwap: false,
        v3Swap: false,
      },
    },
    // #4 x only
    {
      query: bestXApiAtom,
      overrides: {},
    },
  ],
  [
    {
      query: bestAMMTradeFromQuoterWorkerAtom,
      overrides: {},
    },
  ],
]

export function getRoutingStrategy(hash: string) {
  if (cache.has(hash)) {
    return cache.get(hash)!
  }
  return defaultRoutingStrategy
}

export function updateStrategy(hash: string, route: StrategyRoute) {
  const newStrategy: RoutingStrategy = [[route], ...defaultRoutingStrategy]
  cache.set(hash, newStrategy)
}
