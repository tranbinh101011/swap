/**
 * Ultra Simple Client Test Component
 * Just to verify client-side execution is working
 */
import { useEffect, useState } from 'react'

export function UltraSimpleClientTest() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    console.log('🟢 [ULTRA-SIMPLE-TEST] ===============================')
    console.log('🟢 [ULTRA-SIMPLE-TEST] COMPONENT MOUNTED ON CLIENT SIDE')
    console.log('🟢 [ULTRA-SIMPLE-TEST] Current URL:', window.location.href)
    console.log('🟢 [ULTRA-SIMPLE-TEST] URL Search:', window.location.search)
    console.log('🟢 [ULTRA-SIMPLE-TEST] Document Ready:', document.readyState)
    console.log('🟢 [ULTRA-SIMPLE-TEST] ===============================')
    
    // Test URL parameter extraction
    const urlParams = new URLSearchParams(window.location.search)
    const authToken = urlParams.get('auth')
    
    if (authToken) {
      console.log('🔑 [ULTRA-SIMPLE-TEST] Found auth token:', authToken)
    } else {
      console.log('❌ [ULTRA-SIMPLE-TEST] No auth token found')
    }
  }, [])

  // Don't render anything on server-side
  if (!mounted) {
    return null
  }

  return (
    <div style={{
      position: 'fixed',
      top: '50px',
      right: '10px',
      background: '#00ff00',
      color: '#000',
      padding: '20px',
      fontSize: '14px',
      zIndex: 10000,
      border: '2px solid black'
    }}>
      <div><strong>🟢 CLIENT-SIDE TEST</strong></div>
      <div>✅ Component is mounted</div>
      <div>✅ Running on client-side</div>
      <div>URL: {window.location.pathname}</div>
      <div>Search: {window.location.search}</div>
    </div>
  )
}
