import QuickLRU from 'quick-lru'
import { keccak256, stringify } from 'viem'

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
type CacheOptions<T extends AsyncFunction<any>> = {
  maxCacheSize?: number
  ttl: number
  persist?: {
    name: string
    version: string
    type: 'r2'
  }
  key?: (params: Parameters<T>) => any
  isValid?: (result: any) => boolean
  autoRevalidate?: {
    key: (params: Parameters<T>) => string
    interval: number
  }
  maxAge?: number
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

const revalidateTimers = new Map<
  string,
  {
    halfTTSTimer: NodeJS.Timeout | null
    invalidateTimer: NodeJS.Timeout | null
  }
>()

function getTimer(id: string) {
  if (!revalidateTimers.has(id)) {
    revalidateTimers.set(id, {
      halfTTSTimer: null,
      invalidateTimer: null,
    })
  }
  return revalidateTimers.get(id)!
}

export const cacheByLRU = <T extends AsyncFunction<any>>(
  fn: T,
  { ttl, key, maxCacheSize, persist, isValid, autoRevalidate, maxAge }: CacheOptions<T>,
) => {
  const cache = new QuickLRU<string, CacheItem>({
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

  let startTime = 0
  const epochs: Epoch[] = []
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    // Start Time
    if (!startTime) {
      startTime = Date.now()
    }
    const epoch = (Date.now() - startTime) / ttl
    const halfTTS = epoch % 1 > 0.5
    const epochId = Math.floor(epoch)

    // Uniq cache ke related to content
    const contentCacheKey = calcCacheKey(keyFunction(args), 0)

    const cacheForEpoch = (epochId: number) => {
      const cacheKey = calcCacheKey(keyFunction(args), epochId)
      if (cache.has(cacheKey)) {
        return cache.get(cacheKey)!
      }
      // @ts-ignore
      const promise = fn(...args)
      const item = {
        promise,
        resolved: undefined,
        createTime: Date.now(),
        epochId,
      }
      epochs.push({
        createTime: item.createTime,
        cacheKey,
        contentCacheKey,
      })
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

    if (autoRevalidate) {
      let max = 30 // TTS(around 10) * 30 = 300s
      const id = autoRevalidate.key(args)
      const timers = getTimer(id)
      const stop = () => {
        clearTimeout(timers.halfTTSTimer!)
        clearInterval(timers.invalidateTimer!)
      }
      stop()
      let onEpoch = epochId + 1
      timers.halfTTSTimer = setTimeout(() => {
        timers.invalidateTimer = setInterval(() => {
          cacheForEpoch(onEpoch++)
          if (--max === 0) {
            stop()
          }
        }, autoRevalidate.interval)
      })
    }
    if (!autoRevalidate && halfTTS) {
      cacheForEpoch(epochId + 1)
    }

    const current = cacheForEpoch(epochId)
    if (current.resolved) {
      return current.promise
    }
    for (let i = epochs.length - 2, j = 5; i >= 0 && j > 0; i--, j--) {
      const epoch = epochs[i]
      if (maxAge && epoch.createTime + maxAge < Date.now()) {
        continue
      }
      if (epoch.contentCacheKey !== contentCacheKey) {
        continue
      }
      const epochCache = cache.get(epoch.cacheKey)
      if (epochCache && epochCache.resolved) {
        return epochCache.promise
      }
    }

    return current.promise
  }
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
