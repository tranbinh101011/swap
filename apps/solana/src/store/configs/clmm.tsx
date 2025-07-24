import { Trans } from '@pancakeswap/localization'

export const CLMM_FEE_CONFIGS = {
  '9iFER3bpjf1PTTCQCfTRu17EJgvsxo9pVyA9QWwEuX4x': {
    id: '9iFER3bpjf1PTTCQCfTRu17EJgvsxo9pVyA9QWwEuX4x',
    index: 4,
    protocolFeeRate: 120000,
    tradeFeeRate: 100,
    tickSpacing: 1,
    fundFeeRate: 40000,
    fundOwner: 'FundHfY8oo8J9KYGyfXFFuQCHe7Z1VBNmsj84eMcdYs4',
    description: 'Best for very stable pairs',
    defaultRange: 0.1,
    defaultRangePoint: [0.1, 0.2]
  },
  HfERMT5DRA6C1TAqecrJQFpmkf3wsWTMncqnj3RDg5aw: {
    id: 'HfERMT5DRA6C1TAqecrJQFpmkf3wsWTMncqnj3RDg5aw',
    index: 2,
    protocolFeeRate: 120000,
    tradeFeeRate: 500,
    tickSpacing: 10,
    fundFeeRate: 40000,
    fundOwner: 'FundHfY8oo8J9KYGyfXFFuQCHe7Z1VBNmsj84eMcdYs4',
    description: 'Best for stable pairs',
    defaultRange: 0.1,
    defaultRangePoint: [0.1, 0.2]
  },
  E64NGkDLLCdQ2yFNPcavaKptrEgmiQaNykUuLC1Qgwyp: {
    id: 'E64NGkDLLCdQ2yFNPcavaKptrEgmiQaNykUuLC1Qgwyp',
    index: 1,
    protocolFeeRate: 120000,
    tradeFeeRate: 2500,
    tickSpacing: 60,
    fundFeeRate: 40000,
    fundOwner: 'FundHfY8oo8J9KYGyfXFFuQCHe7Z1VBNmsj84eMcdYs4',
    description: 'Best for most pairs',
    defaultRange: 0.1,
    defaultRangePoint: [0.01, 0.05, 0.1, 0.2, 0.5]
  },
  A1BBtTYJd4i3xU8D6Tc2FzU6ZN4oXZWXKZnCxwbHXr8x: {
    id: 'A1BBtTYJd4i3xU8D6Tc2FzU6ZN4oXZWXKZnCxwbHXr8x',
    index: 3,
    protocolFeeRate: 120000,
    tradeFeeRate: 10000,
    tickSpacing: 120,
    fundFeeRate: 40000,
    fundOwner: 'FundHfY8oo8J9KYGyfXFFuQCHe7Z1VBNmsj84eMcdYs4',
    description: 'Best for exotic pairs',
    defaultRange: 0.1,
    defaultRangePoint: [0.01, 0.05, 0.1, 0.2, 0.5, 0.6, 0.7, 0.8, 0.9]
  }
}

export const CREATE_POS_DEVIATION = 0.985 // ask Rudy for detail

const CLMM_TX_MSG = {
  harvest: {
    title: (values: Record<string, unknown>) => <Trans i18nKey="solana.harvest_rewards" values={values} />,
    desc: (values: Record<string, unknown>) => <Trans i18nKey="solana.harvest_clmm_rewards" values={values} />,
    txHistoryTitle: 'solana.harvest_rewards',
    txHistoryDesc: 'solana.harvest_clmm_rewards'
  },
  openPosition: {
    title: (values: Record<string, unknown>) => <Trans i18nKey="solana.add_liquidity" values={values} />,
    desc: (values: Record<string, unknown>) => <Trans i18nKey="solana.added_liquidity_desc" values={values} />,
    txHistoryTitle: 'solana.add_liquidity',
    txHistoryDesc: 'solana.added_liquidity_desc'
  },
  closePosition: {
    title: (values: Record<string, unknown>) => <Trans i18nKey="solana.position_closed" values={values} />,
    desc: (values: Record<string, unknown>) => <Trans i18nKey="solana.close_mint_position" values={values} />,
    txHistoryTitle: 'solana.position_closed',
    txHistoryDesc: 'solana.close_mint_position'
  },
  increaseLiquidity: {
    title: (values: Record<string, unknown>) => <Trans i18nKey="solana.add_liquidity" values={values} />,
    desc: (values: Record<string, unknown>) => <Trans i18nKey="solana.added_liquidity_desc" values={values} />,
    txHistoryTitle: 'solana.add_liquidity',
    txHistoryDesc: 'solana.added_liquidity_desc'
  },
  removeLiquidity: {
    title: (values: Record<string, unknown>) => <Trans i18nKey="solana.remove_liquidity" values={values} />,
    desc: (values: Record<string, unknown>) => <Trans i18nKey="solana.removed_liquidity_desc" values={values} />,
    txHistoryTitle: 'solana.remove_liquidity',
    txHistoryDesc: 'solana.removed_liquidity_desc'
  },
  updateRewards: {
    title: (values: Record<string, unknown>) => <Trans i18nKey="solana.update_rewards" values={values} />,
    desc: (values: Record<string, unknown>) => <Trans i18nKey="solana.update_rewards_in_pool" values={values} />,
    txHistoryTitle: 'solana.update_rewards',
    txHistoryDesc: 'solana.update_rewards_in_pool'
  },
  createPool: {
    title: (values: Record<string, unknown>) => <Trans i18nKey="solana.create_pool" values={values} />,
    desc: (values: Record<string, unknown>) => <Trans i18nKey="solana.create_v3_pool" values={values} />,
    txHistoryTitle: 'solana.create_pool',
    txHistoryDesc: 'solana.create_v3_pool'
  },
  createFarm: {
    title: (values: Record<string, unknown>) => <Trans i18nKey="solana.create_new_farm" values={values} />,
    desc: (values: Record<string, unknown>) => <Trans i18nKey="solana.farm_id" values={values} />,
    txHistoryTitle: 'solana.create_new_farm',
    txHistoryDesc: 'solana.farm_id'
  },
  harvestAll: {
    title: (values: Record<string, unknown>) => <Trans i18nKey="solana.harvest_rewards" values={values} />,
    desc: (values: Record<string, unknown>) => <Trans i18nKey="solana.harvested_symbol" values={values} />,
    txHistoryTitle: 'solana.harvest_rewards',
    txHistoryDesc: 'solana.harvested_symbol'
  },
  lockPosition: {
    title: (values: Record<string, unknown>) => <Trans i18nKey="solana.lock_position" values={values} />,
    desc: (values: Record<string, unknown>) => <Trans i18nKey="solana.position_locked" values={values} />,
    txHistoryTitle: 'solana.lock_position',
    txHistoryDesc: 'solana.position_locked'
  }
}

export const getTxMeta = ({ action, values }: { action: keyof typeof CLMM_TX_MSG; values: Record<string, unknown> }) => {
  const meta = CLMM_TX_MSG[action]

  return {
    title: meta.title(values),
    description: meta.desc(values),
    txHistoryTitle: meta.txHistoryTitle,
    txHistoryDesc: meta.txHistoryDesc,
    txValues: values
  }
}
