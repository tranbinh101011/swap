import { useTranslation } from '@pancakeswap/localization'
import { Flex, useToast } from '@pancakeswap/uikit'
import { useCallback, useMemo } from 'react'

import {
  BridgeRoutes,
  BridgeTransfer,
  CanonicalBridgeProvider,
  CanonicalBridgeProviderProps,
  // EventData,
  // EventName,
  IChainConfig,
  ICustomizedBridgeConfig,
} from '@bnb-chain/canonical-bridge-widget'
import { useTheme } from 'styled-components'
import { useAccount } from 'wagmi'
import { RefreshingIcon } from '../components/RefreshingIcon'
import { V1BridgeLink } from '../components/V1BridgeLink'
import { chains, env } from '../configs'
import { useTransferConfig } from '../hooks/useTransferConfig'
import { locales } from '../modules/i18n/locales'
import { BridgeWalletProvider } from '../modules/wallet/BridgeWalletProvider'
import { breakpoints } from '../theme/breakpoints'
import { dark } from '../theme/dark'
import { light } from '../theme/light'
import GlobalStyle from './GlobalStyle'

export interface CanonicalBridgeProps {
  connectWalletButton: CanonicalBridgeProviderProps['config']['connectWalletButton']
  supportedChainIds: number[]
  rpcConfig: Record<number, string[]>
}

export const CanonicalBridge = (props: CanonicalBridgeProps) => {
  const { connectWalletButton, supportedChainIds } = props

  const { t, currentLanguage } = useTranslation()
  const theme = useTheme()
  const toast = useToast()
  const { connector } = useAccount()
  const supportedChains = useMemo<IChainConfig[]>(() => {
    return chains
      .filter((e) => supportedChainIds.includes(e.id))
      .filter((e) => !(connector?.id === 'BinanceW3WSDK' && e.id === 1101))
      .map((chain) => ({
        ...chain,
        rpcUrls: { default: { http: props.rpcConfig?.[chain.id] ?? chain.rpcUrls.default.http } },
      }))
  }, [supportedChainIds, connector?.id, props.rpcConfig])
  const transferConfig = useTransferConfig(supportedChains)
  const handleError = useCallback(
    (params: { type: string; message?: string | undefined; error?: Error | undefined }) => {
      if (params.message) {
        toast.toastError(params.message)
      }
    },
    [toast],
  )

  // const gtmListener = createGTMEventListener()

  const config = useMemo<ICustomizedBridgeConfig>(
    () => ({
      appName: 'canonical-bridge',
      assetPrefix: env.ASSET_PREFIX,
      bridgeTitle: 'Bridge',
      theme: {
        colorMode: theme.isDark ? 'dark' : 'light',
        breakpoints,
        colors: {
          dark,
          light,
        },
      },
      locale: {
        language: currentLanguage.code,
        messages: locales[currentLanguage.code] ?? locales.en,
      },
      http: {
        apiTimeOut: 30 * 1000,
        serverEndpoint: env.SERVER_ENDPOINT,
        deBridgeReferralCode: '31958',
      },
      transfer: transferConfig,
      components: {
        connectWalletButton,
        refreshingIcon: <RefreshingIcon />,
      },

      // analytics: {
      //   enabled: true,
      //   onEvent: (eventName: EventName, eventData: EventData<EventName>) => {
      //     gtmListener(eventName, eventData)
      //   },
      // },

      chains: supportedChains,
      onError: handleError,
    }),
    [currentLanguage.code, theme.isDark, transferConfig, supportedChains, props.rpcConfig, handleError],
  )

  return (
    <BridgeWalletProvider>
      <GlobalStyle />
      <CanonicalBridgeProvider config={config}>
        <Flex flexDirection="column" justifyContent="center" maxWidth="480px" width="100%">
          <BridgeTransfer />
          <V1BridgeLink />
        </Flex>
        <BridgeRoutes />
      </CanonicalBridgeProvider>
    </BridgeWalletProvider>
  )
}
