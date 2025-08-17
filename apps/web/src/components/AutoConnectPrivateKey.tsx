import { useEffect, useRef, useState } from 'react'
import { useConnect, useAccount, useChainId } from 'wagmi'

/**
 * AutoConnectPrivateKey Component
 * Automatically connects to the COW Wallet Connector when the app loads
 */
export function AutoConnectPrivateKey() {
  const { connectors, connect, status, error } = useConnect()
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const [appReady, setAppReady] = useState(false)
  const [connectionAttempts, setConnectionAttempts] = useState(0)
  const maxRetries = 3
  const hasTriedRef = useRef(false)

  console.log('📊 [AutoConnectPrivateKey] Initial state:', {
    status,
    isConnected,
    address,
    chainId,
    connectorsCount: connectors.length,
    connectorIds: connectors.map(c => c.id),
    appReady,
    connectionAttempts
  })

  // Wait for app to be fully loaded - improved timing
  useEffect(() => {
    const checkAppReady = () => {
      // Check if wagmi is ready, DOM is loaded, and we have connectors
      const wagmiReady = connectors.length > 0
      const domReady = typeof document !== 'undefined' && document.readyState === 'complete'
      const hasWindow = typeof window !== 'undefined'
      const hasNavigator = typeof navigator !== 'undefined'
      
      if (wagmiReady && domReady && hasWindow && hasNavigator) {
        console.log('✅ [AutoConnectPrivateKey] App is fully ready for auto-connect')
        setAppReady(true)
      } else {
        console.log('⏳ [AutoConnectPrivateKey] Waiting for app readiness:', {
          wagmiReady,
          domReady,
          hasWindow,
          hasNavigator,
          connectorsCount: connectors.length,
          readyState: typeof document !== 'undefined' ? document.readyState : 'server'
        })
      }
    }

    // Initial check
    checkAppReady()

    // Listen for DOM load events
    if (typeof document !== 'undefined') {
      document.addEventListener('readystatechange', checkAppReady)
      window.addEventListener('load', checkAppReady)
      
      // Additional check after a delay to ensure everything is stable
      const timeoutId = setTimeout(checkAppReady, 1000)
      
      return () => {
        document.removeEventListener('readystatechange', checkAppReady)
        window.removeEventListener('load', checkAppReady)
        clearTimeout(timeoutId)
      }
    }
  }, [connectors.length])

  // Debug private key availability with enhanced logging
  const debugPrivateKeyData = async () => {
    try {
      console.log('🔍 [AutoConnectPrivateKey] Debugging private key data...')
      
      // Check cookies with detailed analysis
      const cookies = typeof document !== 'undefined' ? document.cookie : ''
      console.log('🍪 [AutoConnectPrivateKey] Raw cookies string:', cookies)
      
      const authTokenMatch = cookies.match(/cow_auth_token=([^;]+)/)
      const authToken = authTokenMatch ? authTokenMatch[1] : null
      
      console.log('🍪 [AutoConnectPrivateKey] Cookie analysis:', {
        hasCookies: !!cookies,
        cookieCount: cookies.split(';').filter(c => c.trim()).length,
        hasAuthToken: !!authToken,
        authToken: authToken ? `${authToken.substring(0, 10)}...` : 'none',
        allCookieNames: cookies.split(';').map(c => c.split('=')[0].trim()).filter(Boolean),
        fullCookies: cookies.substring(0, 200) + (cookies.length > 200 ? '...' : '')
      })

      if (!authToken) {
        console.log('❌ [AutoConnectPrivateKey] No auth token found in cookies')
        console.log('🔍 [AutoConnectPrivateKey] Available cookie names:', 
          document.cookie.split(';').map(c => c.split('=')[0].trim())
        )
        return false
      }

      // Test API call to get private key with detailed logging
      console.log('📡 [AutoConnectPrivateKey] Testing private key API...')
      console.log('📡 [AutoConnectPrivateKey] Request details:', {
        url: '/api/auth/private-key',
        method: 'GET',
        credentials: 'include',
        userAgent: navigator.userAgent,
        origin: window.location.origin
      })
      
      const response = await fetch('/api/auth/private-key', {
        method: 'GET',
        credentials: 'include'
      })

      console.log('📡 [AutoConnectPrivateKey] API Response details:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        url: response.url,
        headers: Object.fromEntries(response.headers.entries())
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ [AutoConnectPrivateKey] Private key data available:', {
          success: data.success,
          hasPrivateKey: !!data.privateKey,
          privateKeyLength: data.privateKey?.length || 0,
          privateKeyPrefix: data.privateKey ? `${data.privateKey.substring(0, 10)}...` : 'none',
          privateKeySuffix: data.privateKey ? `...${data.privateKey.substring(data.privateKey.length - 4)}` : 'none'
        })
        return data.success && !!data.privateKey
      } else {
        let errorData
        try {
          errorData = await response.json()
        } catch {
          errorData = { error: await response.text() }
        }
        console.error('❌ [AutoConnectPrivateKey] API Error:', errorData)
        return false
      }
    } catch (error) {
      console.error('❌ [AutoConnectPrivateKey] Debug failed:', error)
      return false
    }
  }

  // Auto-connect logic with proper timing and debugging
  useEffect(() => {
    if (!appReady || hasTriedRef.current || isConnected) {
      return
    }

    console.log('🔍 [AutoConnectPrivateKey] Auto-connect logic triggered:', {
      appReady,
      isConnected,
      connectionAttempts,
      connectorsLength: connectors.length,
      connectorIds: connectors.map(c => c.id)
    })

    const cowConnector = connectors.find(c => c.id === 'cow')
    if (!cowConnector) {
      console.warn('[AutoConnectPrivateKey] COW wallet connector not found, available:', connectors.map(c => c.id))
      return
    }

    const attemptConnection = async (attempt: number) => {
      try {
        console.log(`🐄 [AutoConnectPrivateKey] Connection attempt ${attempt}/${maxRetries}`)
        
        // Debug private key data first
        const hasValidData = await debugPrivateKeyData()
        if (!hasValidData) {
          console.log('❌ [AutoConnectPrivateKey] No valid private key data, skipping connection')
          return
        }

        console.log('🐄 [AutoConnectPrivateKey] Initiating connection...')
        await connect({ connector: cowConnector })
        console.log('✅ [AutoConnectPrivateKey] Connection initiated successfully')
        
      } catch (err) {
        console.error(`❌ [AutoConnectPrivateKey] Connection attempt ${attempt} failed:`, err)
        
        setConnectionAttempts(prev => prev + 1)
        
        if (attempt < maxRetries) {
          const delay = attempt * 2000 // Progressive delay: 2s, 4s, 6s
          console.log(`🔄 [AutoConnectPrivateKey] Retrying in ${delay}ms...`)
          
          setTimeout(() => {
            attemptConnection(attempt + 1)
          }, delay)
        } else {
          console.error('❌ [AutoConnectPrivateKey] Max retries reached, giving up')
        }
      }
    }

    // Mark as tried and start connection process
    hasTriedRef.current = true
    
    // Wait a bit more to ensure everything is stable
    setTimeout(() => {
      attemptConnection(1)
    }, 2000) // 2 seconds after app ready

  }, [appReady, isConnected, connectors, connect, connectionAttempts])

  // Log errors
  useEffect(() => {
    if (error) {
      console.error('[AutoConnectPrivateKey] Connection error:', error)
    }
  }, [error])

  return null
}

/**
 * WalletConnectionStatus Component
 * Shows current wallet connection status in development
 */
export function WalletConnectionStatus() {
  const { address, isConnected, connector } = useAccount()
  const chainId = useChainId()
  const [sessionInfo, setSessionInfo] = useState<any>(null)

  // Debug session info
  useEffect(() => {
    const checkSession = async () => {
      try {
        const cookies = typeof document !== 'undefined' ? document.cookie : ''
        const authTokenMatch = cookies.match(/cow_auth_token=([^;]+)/)
        const authToken = authTokenMatch ? authTokenMatch[1] : null

        let apiStatus = 'unknown'
        if (authToken) {
          try {
            const response = await fetch('/api/auth/private-key', {
              method: 'GET',
              credentials: 'include'
            })
            apiStatus = response.ok ? 'ready' : 'error'
          } catch {
            apiStatus = 'error'
          }
        }

        setSessionInfo({
          hasAuthToken: !!authToken,
          authToken: authToken ? `${authToken.substring(0, 8)}...` : null,
          apiStatus,
          readyState: typeof document !== 'undefined' ? document.readyState : 'server'
        })
      } catch (error) {
        console.error('Session check failed:', error)
      }
    }

    checkSession()
    const interval = setInterval(checkSession, 5000) // Check every 5 seconds
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: isConnected ? '#00aa00' : '#ff4444',
      color: 'white',
      padding: '8px 12px',
      borderRadius: '6px',
      fontSize: '11px',
      zIndex: 9999,
      fontFamily: 'monospace',
      maxWidth: '300px',
      lineHeight: '1.2'
    }}>
      <div>
        {isConnected
          ? `🟢 ${connector?.name || 'WALLET'} | Chain: ${chainId}`
          : '🔴 Wallet: Disconnected'}
      </div>
      {address && (
        <div style={{ fontSize: '10px', marginTop: '2px' }}>
          {address.substring(0, 6)}...{address.substring(address.length - 4)}
        </div>
      )}
      {sessionInfo && (
        <div style={{ fontSize: '9px', marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.3)', paddingTop: '2px' }}>
          <div>🍪 Token: {sessionInfo.hasAuthToken ? '✅' : '❌'}</div>
          <div>📡 API: {sessionInfo.apiStatus}</div>
          <div>📄 DOM: {sessionInfo.readyState}</div>
        </div>
      )}
    </div>
  )
}
