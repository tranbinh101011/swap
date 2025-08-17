// Browser cookie test script
// Run this in browser console để test cookie functionality

console.log('=== COW WALLET COOKIE DEBUG TEST ===')

// 1. Check current cookies
console.log('1. Current cookies:', document.cookie)

// 2. Try to set a test cookie
document.cookie = 'test_cow_token=test123; Path=/; SameSite=Lax; Max-Age=3600'
console.log('2. After setting test cookie:', document.cookie)

// 3. Test reading specific cookie
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

console.log('3. Reading test cookie:', getCookie('test_cow_token'))
console.log('4. Reading cow_auth_token:', getCookie('cow_auth_token'))

// 5. List all cookies
const allCookies = document.cookie.split(';').map(c => {
  const [name, value] = c.trim().split('=')
  return { name, value: value ? value.substring(0, 20) + '...' : 'empty' }
})
console.log('5. All cookies parsed:', allCookies)

// 6. Test API call
fetch('/api/auth/private-key', {
  method: 'GET',
  credentials: 'include'
})
.then(response => {
  console.log('6. API response status:', response.status)
  return response.json()
})
.then(data => {
  console.log('6. API response data:', data)
})
.catch(error => {
  console.error('6. API error:', error)
})

console.log('=== END DEBUG TEST ===')
