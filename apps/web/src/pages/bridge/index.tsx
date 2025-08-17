import { ChainId } from '@pancakeswap/chains'
import { Flex, useMatchBreakpoints } from '@pancakeswap/uikit'
import ConnectWalletButton from 'components/ConnectWalletButton'
import { PUBLIC_NODES } from 'config/nodes'
import { lazy, Suspense, useEffect } from 'react'
import { CHAIN_IDS } from 'utils/wagmi'
import Page from 'views/Page'
import { createGlobalStyle } from 'styled-components'

const CanonicalBridge = lazy(() =>
  import('@pancakeswap/canonical-bridge').then((module) => ({ default: module.CanonicalBridge })),
)

// Global style to hide V1BridgeLink and top menu
const GlobalStyleForBridge = createGlobalStyle`
  /* Hide the top navigation menu using more specific selectors */
  [data-theme] > div:first-child {
    display: none !important;
  }
  /* Hide any navigation bar */
  nav {
    display: none !important;
  }
  /* Hide header */
  header {
    display: none !important;
  }
  /* Hide elements with common menu class names */
  .menu,
  .navigation,
  .navbar,
  .top-bar,
  .header-menu {
    display: none !important;
  }
`

// Hook to hide menu and V1 bridge link using DOM manipulation
function useHideBridgeElements() {
  useEffect(() => {
    const hideElements = () => {
      // Hide V1 Bridge Link
      const v1BridgeLinks = document.querySelectorAll('a[href="https://bridge.pancakeswap.finance/"]')
      v1BridgeLinks.forEach(link => {
        if (link.parentElement) {
          link.parentElement.style.display = 'none'
        }
        link.style.display = 'none'
      })

      // Hide text containing "V1 Bridge supports"
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
      )

      let node
      while (node = walker.nextNode()) {
        if (node.textContent && node.textContent.includes('V1 Bridge supports')) {
          let parent = node.parentElement
          while (parent) {
            if (parent.tagName === 'DIV') {
              parent.style.display = 'none'
              break
            }
            parent = parent.parentElement
          }
        }
      }

      // Hide top menu by targeting common selectors
      const menuSelectors = [
        '[data-theme] > div:first-child',
        'nav',
        'header',
        '.menu',
        '.navigation',
        '.navbar',
        '.top-bar',
        '[class*="Menu"]',
        '[class*="menu"]'
      ]

      menuSelectors.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector)
          elements.forEach(el => {
            // Check if this element contains navigation links
            const hasNavLinks = el.querySelector('a[href="/swap"], a[href="/trade"], a[href="/bridge"], a[href="/earn"]')
            if (hasNavLinks) {
              (el as HTMLElement).style.display = 'none'
            }
          })
        } catch (e) {
          // Ignore selector errors
        }
      })
    }

    // Run immediately
    hideElements()

    // Run after a short delay to catch dynamically loaded content
    const timer = setTimeout(hideElements, 1000)

    // Run when DOM changes
    const observer = new MutationObserver(hideElements)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      clearTimeout(timer)
      observer.disconnect()
    }
  }, [])
}

// Fix portal conflicts between Privy and Chakra portals
function usePortalConflictFix() {
  useEffect(() => {
    const handlePortalConflict = () => {
      // Check for both portals existing
      const headlessuiPortals = document.querySelectorAll('[id*="headlessui-portal-root"]')
      const chakraPortals = document.querySelectorAll('[class*="chakra-portal"]')

      if (headlessuiPortals.length > 0 && chakraPortals.length > 0) {
        // Temporarily hide chakra portals when headlessui modal is active
        chakraPortals.forEach((portal) => {
          const portalElement = portal as HTMLElement
          portalElement.style.visibility = 'hidden'
        })

        // Restore visibility when headlessui portal is removed
        const observer = new MutationObserver(() => {
          const remainingHeadlessuiPortals = document.querySelectorAll('[id*="headlessui-portal-root"]')
          if (remainingHeadlessuiPortals.length === 0) {
            chakraPortals.forEach((portal) => {
              const portalElement = portal as HTMLElement
              portalElement.style.visibility = 'visible'
            })
          }
        })

        observer.observe(document.body, { childList: true, subtree: true })

        return () => observer.disconnect()
      }

      return undefined
    }

    // Monitor for portal creation
    const portalObserver = new MutationObserver(handlePortalConflict)
    portalObserver.observe(document.body, { childList: true, subtree: true })

    // Also check immediately
    handlePortalConflict()

    return () => {
      portalObserver.disconnect()
    }
  }, [])
}

const DISABLED_TO_CHAINS = [ChainId.POLYGON_ZKEVM]

const BridgePage = () => {
  const { isMobile } = useMatchBreakpoints()

  // Hide bridge elements
  useHideBridgeElements()
  
  // Fix portal conflicts on this page
  usePortalConflictFix()

  return (
    <Page removePadding hideFooterOnDesktop={false} showExternalLink={false} showHelpLink={false} noMinHeight>
      <GlobalStyleForBridge />
      <Flex
        width="100%"
        height="100%"
        justifyContent="center"
        position="relative"
        px={isMobile ? '16px' : '24px'}
        pb={isMobile ? '14px' : '48px'}
        pt={isMobile ? '24px' : '64px'}
        alignItems="flex-start"
        max-width="unset"
      >
        <Suspense>
          <CanonicalBridge
            connectWalletButton={<div style={{ display: 'none' }}></div>}
            supportedChainIds={CHAIN_IDS}
            // @ts-ignore
            rpcConfig={PUBLIC_NODES}
            disabledToChains={DISABLED_TO_CHAINS}
          />
        </Suspense>
      </Flex>
    </Page>
  )
}

BridgePage.chains = CHAIN_IDS
BridgePage.screen = true

export default BridgePage
