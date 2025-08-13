import { useEffect, useRef } from 'react'
import { useConnect, useAccount, useChainId } from 'wagmi'

/**
 * AutoConnectPrivateKey Component
 * Automatically connects to the Private Key Connector when the app loads
 */
export function AutoConnectPrivateKey() {
  const connectAttempted = useRef(false)

  const { connectors, connect, status, error } = useConnect()
  const { address, isConnected } = useAccount()
  const chainId = useChainId()

  console.log('📊 [AutoConnectPrivateKey] Initial state:', {
    status,
    isConnected,
    address,
    chainId,
    connectorsCount: connectors.length,
    connectorIds: connectors.map(c => c.id),
    connectAttempted: connectAttempted.current
  })

  // Auto-connect logic
  useEffect(() => {
    if (isConnected || connectors.length === 0 || connectAttempted.current) {
      return
    }

    const privateKeyConnector = connectors.find(c => c.id === 'privateKey')
    if (!privateKeyConnector) {
      console.warn('[AutoConnectPrivateKey] Private key connector not found')
      return
    }

    connectAttempted.current = true
    const timer = setTimeout(() => {
      connect({ connector: privateKeyConnector })
    }, 1000)

    return () => clearTimeout(timer)
  }, [isConnected, connectors, connect])

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
  const { address, isConnected } = useAccount()
  const chainId = useChainId()

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: isConnected ? '#00aa00' : '#ff4444',
      color: 'white',
      padding: '8px 12px',
      borderRadius: '6px',
      fontSize: '12px',
      zIndex: 9999,
      fontFamily: 'monospace'
    }}>
      {isConnected
        ? `🟢 COW WALLET | Chain: ${chainId} | ${address?.substring(0, 6)}...${address?.substring(address.length - 4)}`
        : '🔴 Wallet: Disconnected'}
    </div>
  )
}
