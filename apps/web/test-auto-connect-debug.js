/**
 * Debug script for auto-connect issues
 */

console.log('🧪 === AUTO-CONNECT DEBUG SCRIPT ===')

// Test 1: Check URL parameters
function checkUrlParams() {
  console.log('\n1. 🔍 URL Parameters Check:')
  const url = window.location.href
  const urlParams = new URLSearchParams(window.location.search)
  const authToken = urlParams.get('auth')
  
  console.log('- Current URL:', url)
  console.log('- Search params:', window.location.search)
  console.log('- Auth token:', authToken ? `${authToken.substring(0, 8)}...` : 'NOT_FOUND')
  
  return authToken
}

// Test 2: Test private-key API
async function testPrivateKeyAPI(authToken) {
  console.log('\n2. 📡 Testing Private Key API:')
  
  if (!authToken) {
    console.log('❌ No auth token to test with')
    return false
  }
  
  try {
    const apiUrl = `/api/auth/private-key?token=${authToken}`
    console.log('- API URL:', apiUrl)
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Cache-Control': 'no-cache'
      }
    })
    
    console.log('- Response status:', response.status)
    console.log('- Response ok:', response.ok)
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ API Response:', {
        success: data.success,
        hasPrivateKey: !!data.privateKey,
        privateKeyPrefix: data.privateKey ? data.privateKey.substring(0, 10) + '...' : 'none'
      })
      return data.success && !!data.privateKey
    } else {
      const errorText = await response.text()
      console.log('❌ API Error:', errorText)
      return false
    }
  } catch (error) {
    console.log('❌ API Exception:', error.message)
    return false
  }
}

// Test 3: Check Wagmi connectors
function checkWagmiConnectors() {
  console.log('\n3. 🔗 Wagmi Connectors Check:')
  
  // Access wagmi from global scope if available
  if (typeof window.wagmi !== 'undefined') {
    console.log('✅ Wagmi available on window')
  } else {
    console.log('❌ Wagmi not available on window')
  }
  
  // Try to access connectors from React context (this won't work outside React)
  console.log('ℹ️ Connector info will be available from React components only')
}

// Test 4: Simulate auto-connect flow
async function simulateAutoConnect() {
  console.log('\n4. 🚀 Simulating Auto-Connect Flow:')
  
  const authToken = checkUrlParams()
  
  if (!authToken) {
    console.log('❌ Cannot simulate - no auth token')
    return
  }
  
  const apiWorking = await testPrivateKeyAPI(authToken)
  
  if (!apiWorking) {
    console.log('❌ Cannot simulate - API not working')
    return
  }
  
  console.log('✅ All prerequisites met for auto-connect')
  console.log('ℹ️ Auto-connect should work if COW connector is available')
}

// Run all tests
async function runAllTests() {
  console.log('🏁 Starting comprehensive auto-connect debug...')
  
  checkUrlParams()
  checkWagmiConnectors()
  
  const authToken = checkUrlParams()
  if (authToken) {
    await testPrivateKeyAPI(authToken)
    await simulateAutoConnect()
  }
  
  console.log('\n🏁 Debug complete!')
}

// Export for manual use
window.autoConnectDebug = {
  checkUrlParams,
  testPrivateKeyAPI,
  checkWagmiConnectors,
  simulateAutoConnect,
  runAllTests
}

console.log('✅ Debug functions available on window.autoConnectDebug')
console.log('📋 Run: window.autoConnectDebug.runAllTests()')
