export enum GTMEvent {
  SwapTxSent = 'swapTxSent',
  WalletConnected = 'walletConnected',
}

export enum GTMCategory {
  Wallet = 'Wallet',
  Swap = 'Swap',
}

export enum GTMAction {
  SwapTransactionSent = 'Swap Transaction Sent',
  WalletConnected = 'Wallet Connected',
}

interface CustomGTMDataLayer {
  event: GTMEvent
  category?: GTMCategory
  action?: GTMAction
  label?: string
}

type WindowWithDataLayer = Window & {
  dataLayer: CustomGTMDataLayer[] | undefined
}

declare const window: WindowWithDataLayer

export const customGTMEvent: WindowWithDataLayer['dataLayer'] =
  typeof window !== 'undefined' ? window?.dataLayer : undefined

export const logGTMSwapTxSentEvent = () => {
  console.info('---SwapTxSent---')
  window?.dataLayer?.push({
    event: GTMEvent.SwapTxSent,
    action: GTMAction.SwapTransactionSent,
    category: GTMCategory.Swap,
  })
}

export const logGTMWalletConnectedEvent = (name: string) => {
  console.info('---wallet connected---')
  window?.dataLayer?.push({
    event: GTMEvent.WalletConnected,
    action: GTMAction.WalletConnected,
    category: GTMCategory.Wallet,
    label: name,
  })
}
