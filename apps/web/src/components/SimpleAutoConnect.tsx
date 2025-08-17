/**
 * Simple Auto Connect Test Component
 * Focuses on debugging cookie and auto-connect issues
 */
import { useEffect, useRef, useState } from 'react'
import { useConnect, useAccount, useChainId } from 'wagmi'

export function SimpleAutoConnect() {
  const { connectors, connect, status, error } = useConnect()
  const { address, isConnected } = useAccount()
  const [debugInfo, setDebugInfo] = useState({})
  const hasAttempted = useRef(false)

  // Debug function
  const runDebug = async () => {
    console.log('🧪 [SimpleAutoConnect] Starting debug...')
    
    const info = {
      timestamp: new Date().toISOString(),
      location: window.location.href,
      cookies: document.cookie,
      connectorsCount: connectors.length,
      connectorIds: connectors.map(c => c.id),
      status,
      isConnected,
      address
    }

    // Check for cow_auth_token
    const authToken = document.cookie
      .split(';')
      .find(c => c.trim().startsWith('cow_auth_token='))
      ?.split('=')[1]

    info.hasAuthToken = !!authToken
    info.authToken = authToken ? authToken.substring(0, 8) + '...' : 'NOT_FOUND'

    console.log('🧪 [SimpleAutoConnect] Debug info:', info)
    setDebugInfo(info)

    // Test API if we have token
    if (authToken) {
      try {
        const response = await fetch('/api/auth/private-key', {
          method: 'GET',
          credentials: 'include'
        })
        
        const apiResult = {
          status: response.status,
          ok: response.ok
        }

        if (response.ok) {
          const data = await response.json()
          apiResult.hasPrivateKey = !!data.privateKey
          apiResult.success = data.success
        }

        info.apiTest = apiResult
        console.log('🧪 [SimpleAutoConnect] API test result:', apiResult)
        setDebugInfo({...info})

        // Try auto-connect if API is working
        if (response.ok && !isConnected && !hasAttempted.current) {
          const cowConnector = connectors.find(c => c.id === 'cow')
          if (cowConnector) {
            console.log('🧪 [SimpleAutoConnect] Attempting auto-connect...')
            hasAttempted.current = true
            
            try {
              await connect({ connector: cowConnector })
              console.log('✅ [SimpleAutoConnect] Auto-connect successful!')
            } catch (connectError) {
              console.error('❌ [SimpleAutoConnect] Auto-connect failed:', connectError)
            }
          }
        }

      } catch (apiError) {
        console.error('❌ [SimpleAutoConnect] API test failed:', apiError)
        info.apiTest = { error: apiError.message }
        setDebugInfo({...info})
      }
    }
  }

  // Run debug when component mounts and when connectors change
  useEffect(() => {
    if (connectors.length > 0) {
      const timer = setTimeout(runDebug, 1000) // Wait 1s for stability
      return () => clearTimeout(timer)
    }
  }, [connectors.length, isConnected])

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      left: '10px',
      background: '#000',
      color: '#fff',
      padding: '12px',
      borderRadius: '8px',
      fontSize: '11px',
      fontFamily: 'monospace',
      maxWidth: '400px',
      zIndex: 9999,
      maxHeight: '300px',
      overflow: 'auto'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
        🧪 Simple Auto-Connect Debug
      </div>
      
      <div>Status: {status}</div>
      <div>Connected: {isConnected ? '✅' : '❌'}</div>
      <div>Address: {address ? `${address.substring(0, 8)}...` : 'None'}</div>
      <div>Connectors: {connectors.length}</div>
      
      {debugInfo.hasAuthToken !== undefined && (
        <>
          <div>Auth Token: {debugInfo.hasAuthToken ? '✅' : '❌'}</div>
          <div>Token Value: {debugInfo.authToken || 'None'}</div>
        </>
      )}
      
      {debugInfo.apiTest && (
        <>
          <div>API Status: {debugInfo.apiTest.status}</div>
          <div>API Success: {debugInfo.apiTest.success ? '✅' : '❌'}</div>
          <div>Has Private Key: {debugInfo.apiTest.hasPrivateKey ? '✅' : '❌'}</div>
        </>
      )}
      
      <button 
        onClick={runDebug}
        style={{
          marginTop: '8px',
          padding: '4px 8px',
          background: '#333',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        🔄 Run Debug
      </button>
    </div>
  )
}
