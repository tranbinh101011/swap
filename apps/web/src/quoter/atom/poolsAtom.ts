import { ChainId } from '@pancakeswap/chains'
import { Pool } from '@pancakeswap/smart-router'

import { atom } from 'jotai'
import { atomFamily } from 'jotai/utils'
import { PoolQuery } from 'quoter/quoter.types'
import { FetchCandidatePoolsError } from 'quoter/utils/FetchCandidatePoolsError'
import { isEqualPoolQuery } from 'quoter/utils/PoolHashHelper'
import { poolQueriesFactory } from 'quoter/utils/poolQueries'

export const fetchCommonPoolsOnChain = async (query: PoolQuery) => {
  const queries = poolQueriesFactory(query.currencyA?.chainId || ChainId.BSC)
  try {
    const poolsArray = await Promise.all([
      queries.getStableSwapPools(query),
      queries.getV2CandidatePools(query),
      queries.getV3PoolsWithTicksOnChain(query),
      queries.getInfinityCandidatePools(query),
    ])
    return poolsArray.flat() as Pool[]
  } catch (ex) {
    console.warn(ex)
    throw new FetchCandidatePoolsError('fetchCommonPoolsOnChain')
  }
}
export const commonPoolsOnChainAtom = atomFamily((query: PoolQuery) => {
  return atom(async () => {
    return fetchCommonPoolsOnChain(query)
  })
}, isEqualPoolQuery)

export const commonPoolsAtom = atomFamily((query: PoolQuery) => {
  return atom(async () => {
    const queries = poolQueriesFactory(query.currencyA?.chainId || ChainId.BSC)
    try {
      const poolsArray = await Promise.all([
        queries.getStableSwapPools(query),
        queries.getV2CandidatePools(query),
        queries.getV3CandidatePools(query),
        queries.getInfinityCandidatePools(query),
      ])

      return poolsArray.flat() as Pool[]
    } catch (ex) {
      console.warn(ex)
      throw new FetchCandidatePoolsError('commonPoolsAtom')
    }
  })
}, isEqualPoolQuery)

export const commonPoolsLiteAtom = atomFamily((query: PoolQuery) => {
  return atom(async () => {
    const queries = poolQueriesFactory(query.currencyA?.chainId || ChainId.BSC)
    try {
      const poolsArray = await Promise.all([
        queries.getStableSwapPools(query),
        queries.getV2CandidatePools(query),
        queries.getV3CandidatePoolsWithoutTicks(query),
        queries.getInfinityCandidatePoolsLight(query),
      ])
      return poolsArray.flat() as Pool[]
    } catch (ex) {
      console.warn(ex)
      throw new FetchCandidatePoolsError('commonPoolsLiteAtom')
    }
  })
}, isEqualPoolQuery)
