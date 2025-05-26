import { POOLS_SLOW_REVALIDATE } from 'config/pools'
import { NextRequest, NextResponse } from 'next/server'
import { edgeQueries } from 'quoter/utils/edgePoolQueries'
import { parseCandidatesQuery } from 'quoter/utils/edgeQueries.util'

export const config = {
  runtime: 'edge',
}

export default async function handler(req: NextRequest) {
  const raw = new URL(req.url).search.slice(1)
  try {
    const { chainId, addressA, addressB, protocols } = parseCandidatesQuery(raw)
    const pools = await edgeQueries.fetchAllCandidatePools(addressA, addressB, chainId, protocols)
    const age = POOLS_SLOW_REVALIDATE[chainId] as number
    const staleAge = age * 2
    return NextResponse.json(
      {
        data: pools,
        lastUpdated: Number(Date.now()),
      },
      {
        status: 200,
        headers: {
          'Cache-Control': `public, s-maxage=${age}, stale-while-revalidate=${staleAge}`,
          'Content-Type': 'application/json',
        },
      },
    )
  } catch (ex) {
    console.error(ex)
    return NextResponse.json({ error: `fetch candidates error ` }, { status: 400 })
  }
}
