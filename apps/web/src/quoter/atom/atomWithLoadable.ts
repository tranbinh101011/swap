import { atom, Getter } from 'jotai'
import { unwrap } from 'jotai/utils'

export type Loadable<T> = {
  loading: boolean
  data?: T
  error?: Error
}

export const emptyLoadable = <T>() => {
  return {
    loading: true,
    data: undefined,
    error: undefined,
  } as Loadable<T>
}

export const valueLoadable = <T>(value: T) => {
  return {
    loading: false,
    data: value,
    error: undefined,
  } as Loadable<T>
}

export const errorLoadable = <T>(error: any) => {
  return {
    loading: false,
    data: undefined,
    error,
  } as Loadable<T>
}

export const pendingLoadable = <T>(val?: T) => {
  return {
    loading: true,
    data: val ?? undefined,
    error: undefined,
  } as Loadable<T>
}

export const atomWithLoadable = <T>(asyncFn: (get: Getter) => Promise<T>) => {
  const baseAtom = atom(async (get) => {
    try {
      const result = await asyncFn(get)
      return {
        loading: false,
        data: result,
        error: undefined,
      } as Loadable<T>
    } catch (error: any) {
      return {
        loading: false,
        data: undefined,
        error,
      } as Loadable<T>
    }
  })

  return unwrap(
    baseAtom,
    (prev) =>
      ({
        loading: true,
        data: prev?.data,
        error: prev?.error,
      } as Loadable<T>),
  )
}
