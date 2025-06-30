import { IndexerApiClient } from '../client'
import { paths } from '../schema'

export const getPoolsByMints = async ({
  mintA,
  mintB,
}: {
  mintA: string | undefined
  mintB: string | undefined
}): Promise<
  paths['/cached/v1/pools/info/mint']['get']['responses']['200']['content']['application/json']['data'] | undefined
> => {
  const [token0, token1] = mintA && mintB ? (mintA < mintB ? [mintA, mintB] : [mintB, mintA]) : [mintA, mintB]

  const resp = await IndexerApiClient.GET('/cached/v1/pools/info/mint', {
    params: {
      query:
        token0 && token1
          ? {
              token0,
              token1,
            }
          : token0
          ? {
              token0,
            }
          : {
              token1,
            },
    },
  })

  return resp.data?.data
}
