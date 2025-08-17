/**
 * AutoConnect Private Key Component - Version 2
 * Fixed cross-origin cookie issue by using URL parameters
 * CLIENT-SIDE ONLY EXECUTION - Based on working ClientOnlyAutoConnect pattern
 */
import { useEffect, useRef, useState } from 'react'
import { useConnect, useAccount, useChainId } from 'wagmi'

export function AutoConnectPrivateKeyV2() {
  const { connectors, connect, status, error } = useConnect()
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const [isClient, setIsClient] = useState(false)
  const [appReady, setAppReady] = useState(false)
  const [connectionAttempts, setConnectionAttempts] = useState(0)
  const maxRetries = 3
  const hasTriedRef = useRef(false)

  // Ensure this only runs on client-side
  useEffect(() => {
    setIsClient(true)
    console.log('🎯 [AUTO-CONNECT-V2] === COMPONENT MOUNTED ON CLIENT-SIDE ===')
  }, [])

  // Only proceed if we're on client-side
  useEffect(() => {
    if (!isClient) {
      console.log('⏳ [AUTO-CONNECT-V2] Waiting for client-side hydration...')
      return
    }

    console.log('🚀 [AUTO-CONNECT-V2] Current state:', {
      status,
      isConnected,
      address,
      chainId,
      connectorsCount: connectors.length,
      connectorIds: connectors.map(c => c.id),
      appReady,
      connectionAttempts,
      url: window.location.href,
      isClient
    })

    // Wait for connectors to be ready
    if (connectors.length === 0) {
      console.log('⏳ [AUTO-CONNECT-V2] Waiting for connectors...')
      return
    }

    // Check app ready state
    if (document.readyState === 'complete') {
      setAppReady(true)
      console.log('✅ [AUTO-CONNECT-V2] App ready state achieved')
    } else {
      console.log('⏳ [AUTO-CONNECT-V2] Document not ready yet:', document.readyState)
    }
  }, [isClient, connectors.length, status, isConnected])

  // Auto-connect logic when everything is ready
  useEffect(() => {
    if (!isClient || !appReady || hasTriedRef.current || isConnected || connectionAttempts >= maxRetries) {
      return
    }

    console.log('🔥 [AUTO-CONNECT-V2] Starting auto-connect process...')

    // Check for auth token in URL
    const urlParams = new URLSearchParams(window.location.search)
    const authToken = urlParams.get('auth')

    if (!authToken) {
      console.log('❌ [AUTO-CONNECT-V2] No auth token found in URL')
      return
    }

    console.log('🔑 [AUTO-CONNECT-V2] Found auth token:', authToken.substring(0, 10) + '...')

    // Find COW connector
    const cowConnector = connectors.find(connector => connector.id === 'cow')
    
    if (!cowConnector) {
      console.log('❌ [AUTO-CONNECT-V2] COW connector not found')
      console.log('Available connectors:', connectors.map(c => c.id))
      return
    }

    hasTriedRef.current = true
    setConnectionAttempts(prev => prev + 1)

    console.log('🔌 [AUTO-CONNECT-V2] Attempting to connect with COW connector...')

    connect({ connector: cowConnector }, {
      onSuccess: (data) => {
        console.log('✅ [AUTO-CONNECT-V2] Successfully connected:', data)
      },
      onError: (error) => {
        console.error('❌ [AUTO-CONNECT-V2] Connection failed:', error)
        hasTriedRef.current = false // Allow retry
      }
    })

  }, [isClient, appReady, connectors, connect, isConnected, connectionAttempts, maxRetries])

  // Show connection status
  if (!isClient) {
    return null // Don't render anything on server-side
  }

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: '#000', 
      color: '#fff', 
      padding: '10px', 
      fontSize: '12px', 
      zIndex: 9999 
    }}>
      <div>🎯 AUTO-CONNECT-V2</div>
      <div>Status: {status}</div>
      <div>Connected: {isConnected ? 'Yes' : 'No'}</div>
      <div>Address: {address || 'None'}</div>
      <div>Attempts: {connectionAttempts}/{maxRetries}</div>
      <div>App Ready: {appReady ? 'Yes' : 'No'}</div>
      <div>Connectors: {connectors.length}</div>
      {error && <div style={{ color: 'red' }}>Error: {error.message}</div>}
    </div>
  )
}

// Status display component
export function WalletConnectionStatusV2() {
  const { address, isConnected } = useAccount()
  const { status } = useConnect()

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999
    }}>
      <div>Connection Status: {status}</div>
      <div>Connected: {isConnected ? 'Yes' : 'No'}</div>
      <div>Address: {address || 'None'}</div>
    </div>
  )
}
