import { Trans, TranslateFunction } from '@pancakeswap/localization'

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

type localeProps = Record<string, unknown>

const CLMM_TX_MSG = {
  harvest: {
    titleKey: 'Harvest Rewards',
    title: <Trans>Harvest Rewards</Trans>,
    desc: () => <Trans>Harvest Clmm Rewards</Trans>,
    txHistoryTitle: <Trans>Harvest Rewards</Trans>,
    txHistoryDesc: () => <Trans>Harvest Clmm Rewards</Trans>
  },
  openPosition: {
    titleKey: 'Add Liquidity',
    title: <Trans>Add Liquidity</Trans>,
    desc: (props: localeProps) => <Trans {...props}>Added %amountA% %symbolA% and %amountB% %symbolB%.</Trans>,
    txHistoryTitle: <Trans>Add Liquidity</Trans>,
    txHistoryDesc: (props: localeProps) => <Trans {...props}>Added %amountA% %symbolA% and %amountB% %symbolB%.</Trans>
  },
  closePosition: {
    titleKey: 'Position Closed',
    title: <Trans>Position Closed</Trans>,
    desc: (props: localeProps) => <Trans {...props}>Close %mint% position.</Trans>,
    txHistoryTitle: <Trans>Position Closed</Trans>,
    txHistoryDesc: (props: localeProps) => <Trans {...props}>Close %mint% position.</Trans>
  },
  increaseLiquidity: {
    titleKey: 'Add Liquidity',
    title: <Trans>Add Liquidity</Trans>,
    desc: (props: localeProps) => <Trans {...props}>Added %amountA% %symbolA% and %amountB% %symbolB%.</Trans>,
    txHistoryTitle: <Trans>Add Liquidity</Trans>,
    txHistoryDesc: (props: localeProps) => <Trans {...props}>Added %amountA% %symbolA% and %amountB% %symbolB%.</Trans>
  },
  removeLiquidity: {
    titleKey: 'Remove Liquidity',
    title: <Trans>Remove Liquidity</Trans>,
    desc: (props: localeProps) => <Trans {...props}>Removed %amountA% %symbolA% and %amountB% %symbolB%.</Trans>,
    txHistoryTitle: <Trans>Remove Liquidity</Trans>,
    txHistoryDesc: (props: localeProps) => <Trans {...props}>Removed %amountA% %symbolA% and %amountB% %symbolB%.</Trans>
  },
  updateRewards: {
    titleKey: 'Update rewards',
    title: <Trans>Update rewards</Trans>,
    desc: (props: localeProps) => <Trans {...props}>Update rewards in %pool%.</Trans>,
    txHistoryTitle: <Trans>Update rewards</Trans>,
    txHistoryDesc: (props: localeProps) => <Trans {...props}>Update rewards in %pool%.</Trans>
  },
  createPool: {
    titleKey: 'Create Pool',
    title: <Trans>Create Pool</Trans>,
    desc: (props: localeProps) => <Trans {...props}>Create V3 pool</Trans>,
    txHistoryTitle: <Trans>Create Pool</Trans>,
    txHistoryDesc: (props: localeProps) => <Trans {...props}>Create V3 pool</Trans>
  },
  createFarm: {
    titleKey: 'Create new farm',
    title: <Trans>Create new farm</Trans>,
    desc: (props: localeProps) => <Trans {...props}>ID: %poolId%</Trans>,
    txHistoryTitle: <Trans>Create new farm</Trans>,
    txHistoryDesc: (props: localeProps) => <Trans {...props}>ID: %poolId%</Trans>
  },
  harvestAll: {
    titleKey: 'Harvest Rewards',
    title: <Trans>Harvest Rewards</Trans>,
    desc: (props: localeProps) => <Trans {...props}>Harvested: %symbol%</Trans>,
    txHistoryTitle: <Trans>Harvest Rewards</Trans>,
    txHistoryDesc: (props: localeProps) => <Trans {...props}>Harvested: %symbol%</Trans>
  },
  lockPosition: {
    titleKey: 'Lock Position',
    title: <Trans>Lock Position</Trans>,
    desc: (props: localeProps) => <Trans {...props}>Position %position% locked</Trans>,
    txHistoryTitle: <Trans>Lock Position</Trans>,
    txHistoryDesc: (props: localeProps) => <Trans {...props}>Position %position% locked</Trans>
  }
}

export const getTxMeta = ({
  action,
  values,
  t
}: {
  action: keyof typeof CLMM_TX_MSG
  values: Record<string, unknown>
  t?: TranslateFunction
}) => {
  const meta = CLMM_TX_MSG[action]

  // Use titleKey for string representation, with translation if available
  const stringTitle = t ? t(meta.titleKey) : meta.titleKey

  return {
    title: stringTitle,
    description: meta.desc(values),
    txHistoryTitle: meta.txHistoryTitle || meta.title,
    txHistoryDesc: meta.txHistoryDesc ? meta.txHistoryDesc(values) : meta.desc(values),
    txValues: values
  }
}
