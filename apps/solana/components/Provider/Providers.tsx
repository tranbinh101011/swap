import { LanguageProvider } from '@pancakeswap/localization'
import { DialogProvider, ModalProvider, UIKitProvider, dark, light } from '@pancakeswap/uikit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider as NextThemeProvider, useTheme as useNextTheme } from 'next-themes'
import { WalletProvider } from './WalletProvider'

const StyledUIKitProvider: React.FC<React.PropsWithChildren> = ({ children, ...props }) => {
  const { resolvedTheme } = useNextTheme()
  return (
    <UIKitProvider theme={resolvedTheme === 'dark' ? dark : light} {...props}>
      {children}
    </UIKitProvider>
  )
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
})

export const Providers: React.FC<React.PropsWithChildren<{ children: React.ReactNode }>> = ({ children }) => {
  return (
    <NextThemeProvider>
      <WalletProvider>
        <QueryClientProvider client={queryClient}>
          <StyledUIKitProvider>
            <LanguageProvider>
              <ModalProvider portalProvider={DialogProvider}>{children}</ModalProvider>
            </LanguageProvider>
          </StyledUIKitProvider>
        </QueryClientProvider>
      </WalletProvider>
    </NextThemeProvider>
  )
}
