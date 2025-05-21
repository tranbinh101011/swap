import { WalletConfigV2, WalletIds } from '@pancakeswap/ui-wallets'
import { isFirefox } from 'react-device-detect'

export enum ConnectorNames {
  Petra = 'petra',
  Martian = 'martian',
  Pontem = 'pontem',
  Fewcha = 'fewcha',
  Blocto = 'blocto',
  TrustWallet = 'trustWallet',
  SafePal = 'safePal',
  Rise = 'rise',
  Msafe = 'msafe',
}

export const wallets: WalletConfigV2<ConnectorNames>[] = [
  {
    id: WalletIds.Petra,
    title: 'Petra',
    icon: '/images/wallets/petra.png',
    get installed() {
      return typeof window !== 'undefined' && Boolean(window.aptos)
    },
    connectorId: ConnectorNames.Petra,
    downloadLink: {
      desktop: 'https://petra.app/',
    },
  },
  {
    id: WalletIds.Martian,
    title: 'Martian',
    icon: '/images/wallets/martian.png',
    get installed() {
      return typeof window !== 'undefined' && Boolean(window.martian)
    },
    connectorId: ConnectorNames.Martian,
    downloadLink: {
      desktop: 'https://martianwallet.xyz/',
    },
  },
  {
    id: WalletIds.Pontem,
    title: 'Pontem',
    icon: '/images/wallets/pontem.png',
    get installed() {
      return typeof window !== 'undefined' && Boolean(window.pontem)
    },
    connectorId: ConnectorNames.Pontem,
    downloadLink: {
      desktop: 'https://chrome.google.com/webstore/detail/pontem-aptos-wallet/phkbamefinggmakgklpkljjmgibohnba',
    },
  },
  {
    id: WalletIds.Fewcha,
    title: 'Fewcha',
    icon: '/images/wallets/fewcha.png',
    get installed() {
      return typeof window !== 'undefined' && Boolean(window.fewcha)
    },
    connectorId: ConnectorNames.Fewcha,
    downloadLink: {
      desktop: 'https://fewcha.app/',
    },
  },
  {
    id: WalletIds.Blocto,
    title: 'Blocto',
    icon: '/images/wallets/blocto.png',
    get installed() {
      return typeof window !== 'undefined' && Boolean(window.bloctoAptos) ? true : undefined // undefined to show SDK
    },
    connectorId: ConnectorNames.Blocto,
  },
  {
    id: WalletIds.TrustWallet,
    title: 'Trust Wallet',
    icon: 'https://pancakeswap.finance/images/wallets/trust.png',
    get installed() {
      return typeof window !== 'undefined' && Boolean(window.aptos) && Boolean((window.aptos as any)?.isTrust)
    },
    deepLink: 'https://link.trustwallet.com/open_url?coin_id=637&url=https://aptos.pancakeswap.finance/',
    connectorId: ConnectorNames.TrustWallet,
  },
  {
    id: WalletIds.SafePal,
    title: 'SafePal',
    icon: 'https://pancakeswap.finance/images/wallets/safepal.png',
    get installed() {
      return typeof window !== 'undefined' && Boolean(window.safePal) && Boolean((window.safePal as any)?.sfpPlatform)
    },
    connectorId: ConnectorNames.SafePal,
    downloadLink: {
      desktop: 'https://chrome.google.com/webstore/detail/safepal-extension-wallet/lgmpcpglpngdoalbgeoldeajfclnhafa',
    },
  },
  {
    id: WalletIds.Rise,
    title: 'Rise Wallet',
    icon: '/images/wallets/rise.png',
    get installed() {
      return typeof window !== 'undefined' && Boolean(window.rise)
    },
    connectorId: ConnectorNames.Rise,
    downloadLink: {
      desktop: isFirefox
        ? 'https://addons.mozilla.org/en-US/firefox/addon/rise-wallet/'
        : 'https://chrome.google.com/webstore/detail/rise-aptos-wallet/hbbgbephgojikajhfbomhlmmollphcad',
    },
  },
  {
    id: WalletIds.Msafe,
    title: 'Msafe',
    icon: '/images/wallets/msafe.png',
    get installed() {
      return (
        typeof window !== 'undefined' &&
        typeof document !== 'undefined' &&
        typeof window?.parent !== 'undefined' &&
        window?.parent.window !== window
      )
    },
    isNotExtension: true,
    downloadLink: {
      desktop: {
        text: 'Go to MSafe',
        url: 'https://aptos.m-safe.io/store/pancake',
      },
    },
    connectorId: ConnectorNames.Msafe,
  },
]
