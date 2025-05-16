export enum LoadableTypeNames {
  Pending,
  Fail,
  Just,
  Nothing,
}

export type Just<T> = Loadable<T> & {
  type: LoadableTypeNames.Just
  loading: false
  value: T
}

export type Nothing<T> = Loadable<T> & {
  type: LoadableTypeNames.Nothing
  loading: false
  value: undefined
}

export type Fail<T> = Loadable<T> & {
  type: LoadableTypeNames.Fail
  loading: false
  error: any
}

export type Pending<T> = Loadable<T> & {
  type: LoadableTypeNames.Pending
  loading: true
}

export class Loadable<T> {
  type: LoadableTypeNames

  value: T | undefined

  error: any | undefined

  loading: boolean

  flags: Record<string, boolean> = {}

  extra: Record<string, any> = {}

  private constructor(type: LoadableTypeNames, value: T | undefined, error: any | undefined, loading: boolean) {
    this.type = type
    this.value = value
    this.error = error
    this.loading = loading
  }

  static Just<T>(value: T): Just<T> {
    return new Loadable<T>(LoadableTypeNames.Just, value, undefined, false) as Just<T>
  }

  static Nothing<T>(): Nothing<T> {
    return new Loadable<T>(LoadableTypeNames.Nothing, undefined, undefined, false) as Nothing<T>
  }

  static Fail<T>(error: any): Fail<T> {
    return new Loadable<T>(LoadableTypeNames.Fail, undefined, error, false) as Fail<T>
  }

  static Pending<T>(): Pending<T> {
    return new Loadable<T>(LoadableTypeNames.Pending, undefined, undefined, true) as Pending<T>
  }

  isJust(): this is Just<T> {
    return this.type === LoadableTypeNames.Just
  }

  isNothing(): this is Nothing<T> {
    return this.type === LoadableTypeNames.Nothing
  }

  isFail(): this is Fail<T> {
    return this.type === LoadableTypeNames.Fail
  }

  isPending(): this is Pending<T> {
    return this.type === LoadableTypeNames.Pending
  }

  map<U>(fn: (value: T) => U): Loadable<U> {
    if (this.isJust()) {
      try {
        const newValue = fn(this.value)
        return Loadable.Just(newValue)
      } catch (error) {
        return Loadable.Fail<U>(error)
      }
    }
    if (this.isFail()) {
      return Loadable.Fail<U>(this.error)
    }
    if (this.isNothing()) {
      return Loadable.Nothing<U>()
    }
    return Loadable.Pending<U>()
  }

  async mapAsync<U>(fn: (value: T) => Promise<U>): Promise<Loadable<U>> {
    if (this.isJust()) {
      try {
        const newValue = await fn(this.value)
        return Loadable.Just(newValue)
      } catch (error) {
        return Loadable.Fail<U>(error)
      }
    }
    if (this.isFail()) {
      return Loadable.Fail<U>(this.error)
    }
    if (this.isNothing()) {
      return Loadable.Nothing<U>()
    }
    return Loadable.Pending<U>()
  }

  unwrap(): T {
    if (this.isJust()) {
      return this.value
    }
    if (this.isNothing()) {
      throw new Error('Cannot unwrap Nothing')
    }
    if (this.isFail()) {
      throw new Error(`Cannot unwrap Fail: ${this.error}`)
    }
    throw new Error('Cannot unwrap Pending')
  }

  unwrapOr(defaultValue: T | undefined): T | undefined {
    if (this.isJust()) {
      return this.value
    }
    if (this.isNothing() || defaultValue === undefined || defaultValue === null) {
      return undefined
    }
    if (this.isFail()) {
      throw new Error(`Cannot unwrapOr Fail: ${this.error}`)
    }
    throw new Error('Cannot unwrapOr Pending')
  }

  public setFlag(flag: string) {
    this.flags[flag] = true
    return this
  }

  public hasFlag(flag: string) {
    return this.flags[flag] || false
  }

  public setExtra(key: string, value: any) {
    this.extra[key] = value
    return this
  }

  public getExtra(key: string) {
    return this.extra[key]
  }
}
