import { useMemo } from 'react'
import { UnifiedWalletProvider, ConnectionContext } from '@jup-ag/wallet-adapter'
import { SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'
import { useTheme } from 'next-themes'
import { Connection } from '@solana/web3.js'
import { SOLANA_ENDPOINT } from 'config/endpoint'

export const WalletProvider: React.FC<React.PropsWithChildren<{ children: React.ReactNode }>> = ({ children }) => {
  const { resolvedTheme } = useTheme()
  const wallets = useMemo(() => [new SolflareWalletAdapter()], [])

  const connection = useMemo(() => {
    const unpatchedConnection = new Connection(SOLANA_ENDPOINT)

    // Patch pre-2.0 and 2.0 RPC getLatestBlockhash being invalid
    if (unpatchedConnection) {
      return new Proxy(unpatchedConnection, {
        get: (target, prop, receiver) => {
          // eslint-disable-next-line default-case
          switch (prop) {
            case '_rpcRequest': {
              return async (...args: any[]) => {
                const [rpcMethod] = args

                if (rpcMethod === 'getLatestBlockhash') {
                  const response = await target[prop](...args)

                  const apiVersion = response?.result?.context?.apiVersion
                  const lastValidBlockHeight = response?.result?.value?.lastValidBlockHeight
                  const modifiedLastValidBlockHeight = apiVersion.startsWith('2')
                    ? lastValidBlockHeight
                    : lastValidBlockHeight - 150

                  return Promise.resolve({
                    ...response,
                    // Note: Function expecting string, but after parse we get number
                    id: response.id.toString(),
                    result: {
                      ...response.result,
                      value: {
                        ...response.result.value,
                        lastValidBlockHeight: Number(modifiedLastValidBlockHeight),
                      },
                    },
                  })
                }

                return target[prop](...args)
              }
            }
          }

          return Reflect.get(target, prop, receiver)
        },
      })
    }

    throw new Error('No connection object or endpoint provided')
  }, [])

  return (
    <ConnectionContext.Provider value={{ connection }}>
      <UnifiedWalletProvider
        wallets={wallets}
        config={{
          env: 'mainnet-beta',
          autoConnect: true,
          walletlistExplanation: {
            href: 'https://station.jup.ag/docs/additional-topics/wallet-list',
          },
          theme: resolvedTheme === 'dark' ? 'dark' : 'light',
          metadata: {
            name: 'UnifiedWallet',
            description: 'UnifiedWallet',
            url: 'https://pancake.run',
            iconUrls: ['https://pancakeswap.finance/favicon.ico'],
          },
        }}
      >
        {children}
      </UnifiedWalletProvider>
    </ConnectionContext.Provider>
  )
}
