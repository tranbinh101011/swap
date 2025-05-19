export function withTimeout<Args extends any[], Return>(
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
