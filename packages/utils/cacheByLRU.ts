import { keccak256, stringify } from 'viem'
import { LRU } from './lru'

type AsyncFunction<T extends any[]> = (...args: T) => Promise<any>

interface CacheItem {
  promise: Promise<any>
  resolved: any
  createTime: number
  epochId: number
}

interface Epoch {
  createTime: number
  cacheKey: string
  contentCacheKey: string
}

// Type definitions for the cache.
export type CacheOptions<T extends AsyncFunction<any>> = {
  maxCacheSize?: number
  ttl: number
  persist?: {
    name: string
    version: string
    type: 'r2'
  }
  key?: (params: Parameters<T>) => any
  isValid?: (result: any) => boolean
  maxAge?: number
  rejectWhenNoCache?: boolean
  usingStaleValue?: boolean
  requestTimeout?: number
}

function defaultIsValid(val: any) {
  if (typeof val === 'undefined' || val === '') {
    return false
  }
  if (Array.isArray(val)) {
    return val.length > 0
  }
  if (typeof val === 'object') {
    return Object.keys(val).length > 0
  }
  return true
}

function calcCacheKey(args: any[], epoch: number) {
  const json = stringify(args)
  const r = keccak256(`0x${json}@${epoch}`)
  return r
}

const identity = (args: any) => args

let cacheInstanceId = 1
export const cacheByLRU = <T extends AsyncFunction<any>>(
  fn: T,
  {
    ttl,
    key,
    maxCacheSize,
    persist,
    isValid,
    maxAge,
    rejectWhenNoCache,
    usingStaleValue = true,
    requestTimeout,
  }: CacheOptions<T>,
) => {
  cacheInstanceId++
  const cache = new LRU<string, CacheItem>({
    maxAge: Math.max(ttl * 2, maxAge || 0),
    maxSize: maxCacheSize || 1000,
  })
  const fetchR2Cache = persist
    ? cacheByLRU(_fetchR2Cache, {
        ttl,
      })
    : undefined

  const keyFunction = key || identity

  function persistKey(cacheKey: string) {
    return `${persist?.name}-${persist?.version}-${cacheKey}`
  }

  async function ensurePersist(item: CacheItem, cacheKey: string) {
    if (fetchR2Cache && persist) {
      const r2Promise = fetchR2Cache(persistKey(cacheKey))
      const value = await Promise.race([r2Promise, item.promise])
      return value ?? item.promise
    }
    return item.promise
  }

  const epochs: Epoch[] = []
  // @ts-ignore
  const cachedFn = async (...args: Parameters<T>): ReturnType<T> => {
    const epoch = Date.now() / ttl
    const epochId = Math.floor(epoch)

    // Uniq cache ke related to content
    const contentCacheKey = calcCacheKey(keyFunction(args), 0)

    const cacheForEpoch = (epochId: number) => {
      const cacheKey = calcCacheKey(keyFunction(args), epochId)
      if (cache.has(cacheKey)) {
        return cache.get(cacheKey)!
      }
      const caller = requestTimeout ? withTimeout(fn, requestTimeout) : fn
      const promise = caller(...args)
      const item = {
        promise,
        resolved: undefined,
        createTime: Date.now(),
        epochId,
      }
      const epoch = {
        createTime: item.createTime,
        cacheKey,
        contentCacheKey,
      }
      epochs.push(epoch)
      item.promise = ensurePersist(item, cacheKey)
      cache.set(cacheKey, item)

      promise
        .then((result) => {
          if (!result) {
            cache.delete(cacheKey)
            return
          }
          if (!(isValid || defaultIsValid)(result)) {
            cache.delete(cacheKey)
            return
          }
          item.resolved = result
          const jsonResult = stringify(result)
          if (persist && result && jsonResult !== '{}' && jsonResult !== '[]') {
            uploadR2(persistKey(cacheKey), result).catch((ex) => {
              console.error('Failed to persist cache', ex)
            })
          }
        })
        .catch((error) => {
          console.error('Cache promise failed', error)
          cache.delete(cacheKey)
        })

      return item
    }

    const current = cacheForEpoch(epochId)

    if (current.resolved) {
      return current.promise
    }
    if (usingStaleValue) {
      for (let i = epochs.length - 2; i >= 0; i--) {
        const epoch = epochs[i]
        if (maxAge && epoch.createTime + maxAge < Date.now()) {
          continue
        }
        if (epoch.contentCacheKey !== contentCacheKey) {
          continue
        }
        const epochCache = cache.get(epoch.cacheKey)

        if (epochCache && epochCache.resolved) {
          const timeElapsed = Date.now() - epochCache.createTime
          if (timeElapsed < 5 * ttl) {
            return epochCache.promise
          }
          break
        }
      }
    }
    if (rejectWhenNoCache) {
      throw new Error(
        `No cache found: total=${epochs.length}, current=${current.epochId},  cacheInstanceId=${cacheInstanceId}`,
      )
    }

    return current.promise
  }
  return cachedFn as any as T
}

async function uploadR2(key: string, value: any) {
  console.info('update cache', key)
  if (!process.env.OBJECT_CACHE_SECRET) {
    return
  }
  await fetch(`https://obj-cache.pancakeswap.com`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OBJECT_CACHE_SECRET}`,
    },
    body: JSON.stringify({ key, value }),
  })
}

async function _fetchR2Cache(key: string) {
  const resp = await fetch(`https://proofs.pancakeswap.com/cache/${key}`)
  if (resp.status === 200) {
    return resp.json()
  }
  console.warn(`Failed to fetch cache:https://proofs.pancakeswap.com/cache/${key}`)
  return undefined
}

function withTimeout<Args extends any[], Return>(
  fn: (...args: Args) => Promise<Return>,
  ms: number,
): (...args: Args) => Promise<Return> {
  return async (...args: Args): Promise<Return> => {
    let timer: ReturnType<typeof setTimeout>
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error(`Operation timed out after ${ms}ms`))
      }, ms)
    })

    try {
      return await Promise.race([fn(...args), timeoutPromise])
    } finally {
      clearTimeout(timer!)
    }
  }
}
