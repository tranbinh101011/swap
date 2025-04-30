import { SimpleCache } from '@pancakeswap/utils/SimpleCache'
import { Atom } from 'jotai'
import { AtomFamily } from 'jotai/vanilla/utils/atomFamily'
import { QuoteQuery } from 'quoter/quoter.types'
import { InterfaceOrder } from 'views/Swap/utils'
import { Loadable } from './atomWithLoadable'
import { bestAMMTradeFromQuoterWorker2Atom } from './bestAMMTradeFromQuoterWorker2Atom'
import { bestAMMTradeFromQuoterWorkerAtom } from './bestAMMTradeFromQuoterWorkerAtom'
import { bestRoutingSDKTradeAtom } from './bestRoutingSDKTradeAtom'
import { bestXApiAtom } from './bestXAPIAtom'

type AtomType = AtomFamily<QuoteQuery, Atom<Loadable<InterfaceOrder | undefined>>>
export interface StrategyRoute {
  query: AtomType
  overrides: Partial<QuoteQuery>
  isShadow?: boolean // shadow queries don't provide final result, used for get quite quote for user
  priority?: number
}
type RoutingStrategy = StrategyRoute[]

const cache = new SimpleCache<string, RoutingStrategy>({
  maxSize: 1000,
  maxAge: 1000 * 120, // 2 minites
})

const defaultRoutingStrategy: RoutingStrategy = [
  // Single hop route & with light pools
  {
    query: bestAMMTradeFromQuoterWorker2Atom,
    overrides: {
      maxHops: 1,
      maxSplits: 0,
    },
    isShadow: true,
    priority: 0,
  },
  // routing-sdk
  {
    query: bestRoutingSDKTradeAtom,
    overrides: {},
    priority: 1,
  },
  // X
  {
    query: bestXApiAtom,
    overrides: {},
    priority: 1,
  },
  {
    // Fallback full route
    query: bestAMMTradeFromQuoterWorkerAtom,
    overrides: {},
    priority: 2,
  },
]

export function getRoutingStrategy() {
  return defaultRoutingStrategy
}
