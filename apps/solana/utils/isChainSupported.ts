import { chains } from 'config/chains'

export const isChainSupported = (network?: string): network is string =>
  !!network && chains.map((c) => c.network).includes(network.toLowerCase())
