// CORS Test Script
// Run this in browser console at http://localhost:3001

console.log('🧪 Testing CORS to SWAP API...')

// Test OPTIONS request
fetch('http://localhost:3000/api/auth/cow-wallet', {
  method: 'OPTIONS',
  headers: {
    'Origin': 'http://localhost:3001',
    'Access-Control-Request-Method': 'POST',
    'Access-Control-Request-Headers': 'Content-Type'
  }
})
.then(response => {
  console.log('✅ OPTIONS Response:', {
    status: response.status,
    ok: response.ok,
    headers: Object.fromEntries(response.headers.entries())
  })
  return response.text()
})
.then(text => {
  console.log('✅ OPTIONS Body:', text)
})
.catch(error => {
  console.error('❌ OPTIONS Error:', error)
})

// Test actual POST request
setTimeout(() => {
  console.log('🧪 Testing POST request...')
  
  fetch('http://localhost:3000/api/auth/cow-wallet', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'http://localhost:3001'
    },
    body: JSON.stringify({
      ciphertext: 'test_cipher',
      sessionId: 'test_session'
    })
  })
  .then(response => {
    console.log('✅ POST Response:', {
      status: response.status,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    })
    return response.json()
  })
  .then(data => {
    console.log('✅ POST Data:', data)
  })
  .catch(error => {
    console.error('❌ POST Error:', error)
  })
}, 2000)
