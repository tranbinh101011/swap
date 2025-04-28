import { ChainId } from '@pancakeswap/chains'

import { HOOK_CATEGORY, HookType, POOL_TYPE, type HookData, type PoolType } from '../../types'
import { CL_DYNAMIC_FEE_HOOKS_BY_CHAIN } from './dynamicFeeHook'

export const CL_DYNAMIC_HOOK: HookData = {
  address: CL_DYNAMIC_FEE_HOOKS_BY_CHAIN[ChainId.BSC],
  name: 'Dynamic Fees (CLAMM)',
  poolType: POOL_TYPE.CLAMM,
  description:
    'PancakeSwap’s Dynamic Fee Hook adjusts swap fees based on market volatility—penalizing arbitrageurs and rewarding LPs during turbulence, while keeping fees low in stable conditions for smoother trading.',
  github: 'https://github.com/pancakeswap/',
  learnMoreLink: 'https://docs.pancakeswap.finance/trade/pancakeswap-infinity/hooks/dynamic-fee-hook',
  category: [HOOK_CATEGORY.DynamicFees],
  isVerified: false,
  isUpgradable: false,
  creator: 'https://github.com/pancakeswap/',
  defaultFee: 500,
  hooksRegistration: {
    afterInitialize: true,
    beforeSwap: true,
    afterSwap: true,
  },
  hookType: HookType.Universal,
}

// const BIN_DYNAMIC_HOOK = {
//   address: BIN_DYNAMIC_FEE_HOOKS_BY_CHAIN[ChainId.BSC],
//   name: 'Dynamic Fees (Bin)',
//   poolType: POOL_TYPE.Bin,
//   description: 'It will set lpFee to 3000 i.e 0.3% in afterInitialize',
//   github: 'https://bscscan.com/address/0x870c167eFCEEaDd081EE783Af8c5c7b436f1d3Ce',
//   category: [HOOK_CATEGORY.DynamicFees],
//   isVerified: true,
//   isUpgradable: false,
//   hooksRegistration: {
//     afterInitialize: true,
//     beforeAddLiquidity: true,
//     beforeSwap: true,
//   },
// }
// const BIN_DYNAMIC_HOOK = undefined

const dynamicHooksList: HookData[] = [CL_DYNAMIC_HOOK]

export const bscHooksList: HookData[] = [
  ...dynamicHooksList,
  // {
  //   address: '0x9c5554cCEa7F38c3337f017E8357C3eD62BF9885',
  //   name: 'Fee Discount Hook (Primus)',
  //   poolType: POOL_TYPE.CLAMM,
  //   description:
  //     'Prove your CEX 30-day spot trading volume exceeded $1M with zkTLS by Primus and get 50% off the initial fee. Create your proof via the link (https://pancakeswap-hook.primuslabs.xyz/). The proof is valid for 14 days.',
  //   github: 'https://github.com/primus-labs/pancakeswapv4-cex-trading-hooks',
  //   category: [HOOK_CATEGORY.Oracle, HOOK_CATEGORY.JIT, HOOK_CATEGORY.Others, HOOK_CATEGORY.DynamicFees],
  //   creator: 'https://github.com/primus-labs/',
  //   audit: '',
  //   isVerified: true,
  //   isUpgradable: false,
  //   hooksRegistration: {
  //     afterInitialize: true,
  //     beforeSwap: true,
  //   },
  //   hookType: HookType.Universal,
  //   defaultFee: 3000,
  // },
  // {
  //   address: checksumAddress('0x9F0D5091D31a7801d34da352572BAc84e8Ac48Ad'),
  //   name: 'Fee Discount Hook (CAKE Holding)',
  //   poolType: POOL_TYPE.CLAMM,
  //   description: 'Fee discount based on the last 30-day CAKE token holding.',
  //   github: 'https://github.com/brevis-network/pancake-tokenholding-hook/tree/main',
  //   category: [HOOK_CATEGORY.Oracle, HOOK_CATEGORY.JIT, HOOK_CATEGORY.Others, HOOK_CATEGORY.DynamicFees],
  //   creator: 'https://github.com/brevis-network',
  //   audit: '',
  //   isVerified: true,
  //   isUpgradable: true,
  //   hooksRegistration: {
  //     beforeSwap: true,
  //   },
  //   hookType: HookType.PerPool,
  //   defaultFee: 100000,
  // },
  // {
  //   address: checksumAddress('0x4910a4852A06D0F6B206bd737ea3C98866Be796C'),
  //   name: 'Fee Discount Hook (Trading Volume)',
  //   poolType: POOL_TYPE.CLAMM,
  //   description: 'Fee discount based on the last 30-day trading volume.',
  //   github: 'https://github.com/brevis-network/vip-hook',
  //   category: [HOOK_CATEGORY.Oracle, HOOK_CATEGORY.JIT, HOOK_CATEGORY.Others, HOOK_CATEGORY.DynamicFees],
  //   creator: 'https://github.com/brevis-network',
  //   audit: '',
  //   isVerified: true,
  //   isUpgradable: true,
  //   hooksRegistration: {
  //     beforeSwap: true,
  //   },
  //   hookType: HookType.PerPool,
  //   defaultFee: 100000,
  // },
  // {
  //   address: '0x0A6440c9cfb5f28BE699a9e4e83BF8A89de72498',
  //   name: 'veCake Exclusive (CLAMM)',
  //   poolType: POOL_TYPE.CLAMM,
  //   description:
  //     'This multi-feature contract allows for liquidity locks, TWAMM (Time weighted average market maker), and impermanent loss hedging on pools. Check the Github readme for more details.',
  //   github: 'https://testnet.bscscan.com/address/0x0A6440c9cfb5f28BE699a9e4e83BF8A89de72498',
  //   category: [HOOK_CATEGORY.Oracle, HOOK_CATEGORY.JIT, HOOK_CATEGORY.Others],
  //   creator: 'https://github.com/pancakeswap',
  //   audit: 'https://github.com/pancakeswap',
  //   isVerified: true,
  //   isUpgradable: false,
  //   hooksRegistration: {
  //     beforeSwap: true,
  //   },
  // },
  // {
  //   address: '0x0284ceB8F3Ad42131A6feB69E3F324990837Ef2c',
  //   name: 'veCake Exclusive (Bin)',
  //   poolType: POOL_TYPE.Bin,
  //   description: 'Exclusive to holders of veCake (0x3c3C66383690d3cf08205cD3Ba862bc4F6348829)',
  //   github: 'https://testnet.bscscan.com/address/0x0284ceB8F3Ad42131A6feB69E3F324990837Ef2c',
  //   category: [HOOK_CATEGORY.Others],
  //   isVerified: true,
  //   isUpgradable: false,
  //   hooksRegistration: {
  //     beforeSwap: true,
  //   },
  // },
]

/**
 * Dynamic hook for each pool type for auto-selection on "Dynamic" fee tier
 */
export const bscDynamicHooks: Record<PoolType, HookData | undefined> = {
  CL: CL_DYNAMIC_HOOK,
  Bin: undefined,
}
