/**
 * Test script to debug cookie issues between COW_N and SWAP
 */

console.log('🧪 Testing cookie functionality...')

// Test 1: Simulate cookie setting like COW_N does
console.log('\n1. Testing cookie setting:')
const testAuthToken = 'test_token_12345'

// Simulate what happens when COW_N redirects to SWAP
const testCookieString = `cow_auth_token=${testAuthToken}; Path=/; SameSite=Lax; Max-Age=7200`
console.log('Cookie string that should be set:', testCookieString)

// Test 2: Check if we can read cookies in browser environment
if (typeof document !== 'undefined') {
  console.log('\n2. Current cookies in browser:')
  console.log('document.cookie:', document.cookie)
  
  // Try to manually set a test cookie
  document.cookie = `test_cookie=test_value; Path=/; SameSite=Lax; Max-Age=3600`
  console.log('After setting test cookie:', document.cookie)
  
  // Try to read our specific cookie
  const authTokenMatch = document.cookie.match(/cow_auth_token=([^;]+)/)
  const authToken = authTokenMatch ? authTokenMatch[1] : null
  console.log('Auth token found:', authToken)
  
} else {
  console.log('Running in server environment')
}

// Test 3: Test API call
async function testPrivateKeyAPI() {
  try {
    console.log('\n3. Testing private key API:')
    const response = await fetch('/api/auth/private-key', {
      method: 'GET',
      credentials: 'include'
    })
    
    console.log('API Response status:', response.status)
    console.log('API Response headers:', Object.fromEntries(response.headers.entries()))
    
    const data = await response.json()
    console.log('API Response data:', data)
    
  } catch (error) {
    console.error('API test failed:', error)
  }
}

// Test 4: Simulate redirect from COW_N
function simulateRedirectFromCOWN() {
  console.log('\n4. Simulating redirect from COW_N:')
  
  // This is what COW_N should do:
  // 1. Create session in COW_N
  // 2. Set cookie with auth token  
  // 3. Redirect to SWAP with session data
  
  const sessionData = {
    authToken: 'simulated_auth_token_67890',
    userId: 'test_user_123',
    timestamp: Date.now()
  }
  
  console.log('Session data that should be passed:', sessionData)
  
  // Simulate setting cookie before redirect
  if (typeof document !== 'undefined') {
    const cookieValue = `cow_auth_token=${sessionData.authToken}; Path=/; SameSite=Lax; Max-Age=7200`
    document.cookie = cookieValue
    console.log('Cookie set:', cookieValue)
    console.log('Cookies after setting:', document.cookie)
  }
}

// Run tests if in browser
if (typeof window !== 'undefined') {
  console.log('\n🌐 Running in browser environment')
  
  // Run simulation
  simulateRedirectFromCOWN()
  
  // Test API after a delay
  setTimeout(testPrivateKeyAPI, 1000)
  
} else {
  console.log('\n🖥️ Running in Node.js environment')
}

module.exports = {
  testCookieString: `cow_auth_token=${testAuthToken}; Path=/; SameSite=Lax; Max-Age=7200`,
  simulateRedirectFromCOWN,
  testPrivateKeyAPI
}
