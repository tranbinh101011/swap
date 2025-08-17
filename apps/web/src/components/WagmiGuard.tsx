import { useEffect, useState } from 'react'

/**
 * WagmiGuard - Component wrapper that only renders children when Wagmi is ready
 * Uses a delay-based approach instead of useConfig to avoid circular dependency
 */
export function WagmiGuard({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Give wagmi provider time to initialize
    const timer = setTimeout(() => {
      setIsReady(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  if (!isReady) {
    console.log('⏳ [WagmiGuard] Waiting for wagmi config...')
    return null
  }

  console.log('✅ [WagmiGuard] Wagmi config ready, rendering children')
  return <>{children}</>
}
