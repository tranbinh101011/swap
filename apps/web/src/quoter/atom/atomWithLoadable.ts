import { Loadable } from '@pancakeswap/utils/Loadable'
import { atom, Atom, Getter } from 'jotai'
import { unwrap } from 'jotai/utils'

type AsyncFN<T> = (get: Getter) => Promise<T | undefined>
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T
interface LoadableOption<T> {
  isValid: (result: UnwrapPromise<ReturnType<AsyncFN<T>>>) => boolean
}

export const atomWithLoadable = <T>(asyncFn: AsyncFN<T>, options?: LoadableOption<T>) => {
  const baseAtom = atom<Promise<Loadable<T>>>(async (get) => {
    try {
      const result = await asyncFn(get)
      if (typeof result === 'undefined' || result === null) {
        return Loadable.Nothing<T>()
      }
      if (options?.isValid && !options.isValid(result)) {
        return Loadable.Nothing<T>()
      }
      return Loadable.Just<T>(result)
    } catch (error: any) {
      return Loadable.Fail<T>(error)
    }
  })
  return unwrap(baseAtom, () => Loadable.Pending<T>()) as Atom<Loadable<T>>
}
