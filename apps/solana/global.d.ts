declare global {
  interface Window {
    Jupiter: {
      init: (config: {
        displayMode: string
        integratedTargetId: string
        endpoint: string
        refetchIntervalForTokenAccounts?: number
        formProps?: any
        enableWalletPassthrough?: boolean
        passthroughWalletContextState?: any
        onRequestConnectWallet?: () => void
        strictTokenList?: boolean
        defaultExplorer?: string
      }) => void
      syncProps: (props: { passthroughWalletContextState: any }) => void
    }
  }
}

export {}
