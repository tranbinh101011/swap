/**
 * AutoConnect Private Key Component - Version 2
 * Fixed cross-origin cookie issue by using URL parameters
 */
import { useEffect, useRef, useState } from 'react'
import { useConnect, useAccount, useChainId } from 'wagmi'

export function AutoConnectPrivateKeyV2() {
  const { connectors, connect, status, error } = useConnect()
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const [appReady, setAppReady] = useState(false)
  const [connectionAttempts, setConnectionAttempts] = useState(0)
  const maxRetries = 3
  const hasTriedRef = useRef(false)

  console.log('🎯 [AUTO-CONNECT-V2] === STARTING AUTO CONNECT DEBUG ===')
  console.log('🚀 [AUTO-CONNECT-V2] Current state:', {
    status,
    isConnected,
    address,
    chainId,
    connectorsCount: connectors.length,
    connectorIds: connectors.map(c => c.id),
    appReady,
    connectionAttempts,
    url: typeof window !== 'undefined' ? window.location.href : 'SSR'
  })

  // Force client-side execution check
  useEffect(() => {
    console.log('🌐 [AUTO-CONNECT-V2] Client-side useEffect triggered!')
    console.log('🌐 [AUTO-CONNECT-V2] Window available:', typeof window !== 'undefined')
    console.log('🌐 [AUTO-CONNECT-V2] Document ready state:', typeof document !== 'undefined' ? document.readyState : 'NO_DOCUMENT')
    
    if (typeof window !== 'undefined') {
      console.log('🌐 [AUTO-CONNECT-V2] URL params:', window.location.search)
      console.log('🌐 [AUTO-CONNECT-V2] Full URL:', window.location.href)
    }
  }, [])

  // Wait for app to be fully loaded
  useEffect(() => {
    const checkAppReady = () => {
      const wagmiReady = connectors.length > 0
      const domReady = typeof document !== 'undefined' && document.readyState !== 'loading'
      
      console.log('🔍 [AUTO-CONNECT-V2] Checking app ready:', {
        wagmiReady,
        domReady,
        connectorsCount: connectors.length,
        documentReadyState: typeof document !== 'undefined' ? document.readyState : 'SSR',
        currentAppReady: appReady
      })
      
      if (wagmiReady && domReady && !appReady) {
        console.log('✅ [AUTO-CONNECT-V2] App is ready for auto-connect')
        setAppReady(true)
      }
    }

    checkAppReady()
    
    if (typeof document !== 'undefined') {
      document.addEventListener('readystatechange', checkAppReady)
      window.addEventListener('load', checkAppReady)
      
      const timeoutId = setTimeout(checkAppReady, 2000) // Increased timeout
      
      return () => {
        document.removeEventListener('readystatechange', checkAppReady)
        window.removeEventListener('load', checkAppReady)
        clearTimeout(timeoutId)
      }
    }
  }, [connectors.length, appReady])

  // Get auth token from URL parameter (cross-origin solution)
  const getAuthToken = () => {
    if (typeof window === 'undefined') return null
    
    const urlParams = new URLSearchParams(window.location.search)
    const authToken = urlParams.get('auth')
    
    console.log('🔍 [AUTO-CONNECT-V2] Auth token check:', {
      hasAuthToken: !!authToken,
      authToken: authToken ? `${authToken.substring(0, 8)}...` : 'NOT_FOUND',
      currentUrl: window.location.href,
      searchParams: window.location.search,
      fullToken: authToken // Full token for debugging
    })
    
    return authToken
  }

  // Test API with auth token from URL parameter
  const testPrivateKeyAPI = async (authToken: string) => {
    try {
      console.log('📡 [AutoConnectV2] Testing private key API with URL token...')
      
      // ✅ SOLUTION 1: Use URL parameter directly (no cookie needed)
      const response = await fetch(`/api/auth/private-key?token=${authToken}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })

      console.log('📡 [AutoConnectV2] API Response:', {
        status: response.status,
        ok: response.ok,
        authTokenUsed: authToken.substring(0, 8) + '...'
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ [AutoConnectV2] Private key API working:', {
          success: data.success,
          hasPrivateKey: !!data.privateKey,
          privateKeyPrefix: data.privateKey ? data.privateKey.substring(0, 10) + '...' : 'none'
        })
        return data.success && !!data.privateKey
      } else {
        const errorData = await response.text()
        console.error('❌ [AutoConnectV2] API Error:', errorData)
        return false
      }
    } catch (error) {
      console.error('❌ [AutoConnectV2] API test failed:', error)
      return false
    }
  }

  // Auto-connect logic
  useEffect(() => {
    console.log('🔍 [AUTO-CONNECT-V2] Auto-connect logic triggered:', {
      appReady,
      hasTriedRef: hasTriedRef.current,
      isConnected,
      shouldRun: appReady && !hasTriedRef.current && !isConnected
    })
    
    if (!appReady || hasTriedRef.current || isConnected) {
      console.log('🔍 [AUTO-CONNECT-V2] Auto-connect conditions not met, skipping')
      return
    }

    const attemptAutoConnect = async () => {
      console.log('🚀 [AUTO-CONNECT-V2] Starting auto-connect...')
      hasTriedRef.current = true
      
      try {
        // Get auth token from URL
        const authToken = getAuthToken()
        
        if (!authToken) {
          console.log('❌ [AutoConnectV2] No auth token in URL, skipping auto-connect')
          return
        }

        // Test if API works with this token
        const privateKeyAvailable = await testPrivateKeyAPI(authToken)
        
        if (!privateKeyAvailable) {
          console.log('❌ [AutoConnectV2] Private key API not working, aborting')
          return
        }

        // Find COW connector
        const cowConnector = connectors.find(c => c.id === 'cow')
        if (!cowConnector) {
          console.log('❌ [AutoConnectV2] COW connector not found')
          return
        }

        console.log('🔗 [AutoConnectV2] Connecting with COW connector...')
        
        // Clean URL after getting token
        window.history.replaceState({}, document.title, window.location.pathname)
        
        await connect({ connector: cowConnector })
        console.log('✅ [AutoConnectV2] Auto-connect successful!')
        
      } catch (error) {
        console.error('❌ [AutoConnectV2] Auto-connect failed:', error)
        hasTriedRef.current = false
        
        setConnectionAttempts(prev => {
          const newAttempts = prev + 1
          if (newAttempts < maxRetries) {
            console.log(`🔄 [AutoConnectV2] Retrying (${newAttempts}/${maxRetries})`)
            setTimeout(() => {
              hasTriedRef.current = false
            }, 2000 * newAttempts)
          }
          return newAttempts
        })
      }
    }

    setTimeout(attemptAutoConnect, 1000)

  }, [appReady, isConnected, connectors, connect, connectionAttempts])

  return null
}

// Status display component
export function WalletConnectionStatusV2() {
  const { address, isConnected, connector } = useAccount()
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [apiStatus, setApiStatus] = useState<string>('unknown')

  useEffect(() => {
    // Check URL parameter for auth token
    const urlParams = new URLSearchParams(window.location.search)
    const token = urlParams.get('auth')
    setAuthToken(token)

    // Test API if we have token
    if (token) {
      document.cookie = `cow_auth_token=${token}; Path=/; SameSite=Lax; Max-Age=7200`
      
      fetch('/api/auth/private-key', {
        method: 'GET',
        credentials: 'include'
      })
      .then(response => setApiStatus(response.ok ? 'ready' : 'error'))
      .catch(() => setApiStatus('error'))
    }
  }, [])

  if (process.env.NODE_ENV !== 'development') return null

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: '#000',
      color: '#fff',
      padding: '12px',
      borderRadius: '8px',
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 9999
    }}>
      <div><strong>🐄 COW Wallet Status V2</strong></div>
      <div>Connected: {isConnected ? '✅' : '❌'}</div>
      <div>Address: {address ? `${address.substring(0, 8)}...` : 'None'}</div>
      <div>Connector: {connector?.id || 'None'}</div>
      <div>Token: {authToken ? '✅' : '❌'}</div>
      <div>API: {apiStatus === 'ready' ? '✅' : apiStatus === 'error' ? '❌' : '❓'}</div>
    </div>
  )
}
