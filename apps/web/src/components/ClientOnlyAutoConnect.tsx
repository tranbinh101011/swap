/**
 * Client-Only Auto Connect Component
 * This component ONLY runs on client-side to avoid SSR issues
 */
import { useEffect, useRef, useState } from 'react'
import { useConnect, useAccount, useChainId } from 'wagmi'

export function ClientOnlyAutoConnect() {
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
    console.log('🎯 [CLIENT-ONLY-AUTO-CONNECT] === COMPONENT MOUNTED ON CLIENT-SIDE ===')
  }, [])

  // Only proceed if we're on client-side
  useEffect(() => {
    if (!isClient) {
      console.log('⏳ [CLIENT-ONLY-AUTO-CONNECT] Waiting for client-side hydration...')
      return
    }

    console.log('🚀 [CLIENT-ONLY-AUTO-CONNECT] Current state:', {
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
      console.log('⏳ [CLIENT-ONLY-AUTO-CONNECT] Waiting for connectors...')
      return
    }

    // Check app ready state
    if (document.readyState === 'complete') {
      setAppReady(true)
      console.log('✅ [CLIENT-ONLY-AUTO-CONNECT] App ready state achieved')
    } else {
      console.log('⏳ [CLIENT-ONLY-AUTO-CONNECT] Document not ready yet:', document.readyState)
    }
  }, [isClient, connectors.length, status, isConnected])

  // Auto-connect logic when everything is ready
  useEffect(() => {
    if (!isClient || !appReady || hasTriedRef.current || isConnected || connectionAttempts >= maxRetries) {
      return
    }

    console.log('🔥 [CLIENT-ONLY-AUTO-CONNECT] Starting auto-connect process...')

    // Check for auth token in URL
    const urlParams = new URLSearchParams(window.location.search)
    const authToken = urlParams.get('auth')

    if (!authToken) {
      console.log('❌ [CLIENT-ONLY-AUTO-CONNECT] No auth token found in URL')
      return
    }

    console.log('🔑 [CLIENT-ONLY-AUTO-CONNECT] Found auth token:', authToken.substring(0, 10) + '...')

    // Find COW connector
    const cowConnector = connectors.find(connector => connector.id === 'cow')
    
    if (!cowConnector) {
      console.log('❌ [CLIENT-ONLY-AUTO-CONNECT] COW connector not found')
      console.log('Available connectors:', connectors.map(c => c.id))
      return
    }

    hasTriedRef.current = true
    setConnectionAttempts(prev => prev + 1)

    console.log('🔌 [CLIENT-ONLY-AUTO-CONNECT] Attempting to connect with COW connector...')

    connect({ connector: cowConnector }, {
      onSuccess: (data) => {
        console.log('✅ [CLIENT-ONLY-AUTO-CONNECT] Successfully connected:', data)
      },
      onError: (error) => {
        console.error('❌ [CLIENT-ONLY-AUTO-CONNECT] Connection failed:', error)
        hasTriedRef.current = false // Allow retry
      }
    })

  }, [isClient, appReady, connectors, connect, isConnected, connectionAttempts, maxRetries])

  // Show connection status
  if (!isClient) {
    return null // Don't render anything on server-side
  }

  return (
    <div style={{ position: 'fixed', top: '10px', right: '10px', background: '#000', color: '#fff', padding: '10px', fontSize: '12px', zIndex: 9999 }}>
      <div>🎯 CLIENT-ONLY AUTO-CONNECT</div>
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
