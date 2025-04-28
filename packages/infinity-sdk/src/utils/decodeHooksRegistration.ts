/* eslint-disable no-bitwise */
import invariant from 'tiny-invariant'
import { Hex } from 'viem'
import { HooksRegistration } from '../types'

const HOOKS_REGISTRATION_OFFSET: Record<keyof HooksRegistration, number> = {
  beforeInitialize: 0,
  afterInitialize: 1,
  beforeAddLiquidity: 2,
  afterAddLiquidity: 3,
  beforeRemoveLiquidity: 4,
  afterRemoveLiquidity: 5,
  beforeSwap: 6,
  afterSwap: 7,
  beforeDonate: 8,
  afterDonate: 9,
}

export const decodeHooksRegistration = (encoded: Hex | number): HooksRegistration => {
  const registration = typeof encoded === 'number' ? encoded : parseInt(encoded, 16)

  invariant(registration >= 0 && registration <= 0x03ff, 'Invalid hooks registration')

  const hooksRegistration: Partial<HooksRegistration> = {}

  // eslint-disable-next-line guard-for-in
  for (const key in HOOKS_REGISTRATION_OFFSET) {
    if (registration & (1 << HOOKS_REGISTRATION_OFFSET[key as keyof HooksRegistration])) {
      hooksRegistration[key as keyof HooksRegistration] = true
    }
  }

  return hooksRegistration as HooksRegistration
}
