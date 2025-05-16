import { Loadable } from '@pancakeswap/utils/Loadable'
import { Atom } from 'jotai'
import { AtomFamily } from 'jotai/vanilla/utils/atomFamily'
import { QuoteQuery } from 'quoter/quoter.types'
import { InterfaceOrder } from 'views/Swap/utils'
import { bestAMMTradeFromQuoterWorker2Atom } from './bestAMMTradeFromQuoterWorker2Atom'
import { bestAMMTradeFromQuoterWorkerAtom } from './bestAMMTradeFromQuoterWorkerAtom'
import { bestRoutingSDKTradeAtom } from './bestRoutingSDKTradeAtom'
import { bestXApiAtom } from './bestXAPIAtom'

type AtomType = AtomFamily<QuoteQuery, Atom<Loadable<InterfaceOrder>>>
export interface StrategyRoute {
  query: AtomType
  overrides: Partial<QuoteQuery>
  isShadow?: boolean // shadow queries don't provide final result, used for get quite quote for user
  priority?: number
  key: string
}
type RoutingStrategy = StrategyRoute[]

const defaultRoutingStrategy: RoutingStrategy = [
  // Single hop route & with light pools
  {
    key: 'single',
    query: bestAMMTradeFromQuoterWorker2Atom,
    overrides: {
      maxHops: 1,
      maxSplits: 0,
    },
    priority: 1,
  },
  // routing-sdk
  {
    key: 'routing-sdk',
    query: bestRoutingSDKTradeAtom,
    overrides: {},
    priority: 1,
  },
  // X
  {
    key: 'x',
    query: bestXApiAtom,
    overrides: {},
    priority: 1,
  },
  {
    // Fallback full route
    key: 'full',
    query: bestAMMTradeFromQuoterWorkerAtom,
    overrides: {},
    priority: 2,
  },
]

export function getRoutingStrategy() {
  return defaultRoutingStrategy
}
