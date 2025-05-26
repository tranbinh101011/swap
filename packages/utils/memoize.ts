export default function memoize<T extends (...args: any[]) => any>(
  fn: T,
  resolver?: (...args: Parameters<T>) => any,
): T & { cache: Map<any, ReturnType<T>> } {
  const cache = new Map<any, ReturnType<T>>()

  const memoized = function (...args: Parameters<T>): ReturnType<T> {
    const key = resolver ? resolver(...args) : args[0]
    if (cache.has(key)) {
      return cache.get(key)!
    }

    const result = fn(...args)
    cache.set(key, result)
    return result
  }

  ;(memoized as T & { cache: Map<any, ReturnType<T>> }).cache = cache

  return memoized as T & { cache: Map<any, ReturnType<T>> }
}
