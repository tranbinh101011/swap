/**
 * Test script để mô phỏng flow auto-connect từ COW_N sang SWAP
 * 
 * Flow:
 * 1. User login vào COW_N (localhost:3001)
 * 2. COW_N tạo session và set cookie
 * 3. User click "Open SWAP" -> redirect sang localhost:3000/swap
 * 4. SWAP auto-connect dựa trên session cookie
 */

console.log('🧪 [Test Auto-Connect] Starting test flow...')

// Function để test các bước
async function testAutoConnectFlow() {
  console.log('\n=== STEP 1: Kiểm tra COW_N Health ===')
  
  try {
    const cowHealthResponse = await fetch('http://localhost:3001/api/health', {
      method: 'GET'
    })
    
    if (cowHealthResponse.ok) {
      console.log('✅ COW_N server is running')
    } else {
      throw new Error('COW_N not responding')
    }
  } catch (error) {
    console.error('❌ COW_N server not accessible:', error.message)
    console.log('🔧 Make sure COW_N is running on port 3001')
    return
  }

  console.log('\n=== STEP 2: Kiểm tra SWAP Health ===')
  
  try {
    const swapHealthResponse = await fetch('http://localhost:3000/api/auth/private-key', {
      method: 'GET'
    })
    
    // Expect 401 vì chưa có cookie
    if (swapHealthResponse.status === 401) {
      console.log('✅ SWAP server is running (401 as expected without cookie)')
    } else {
      console.log('⚠️ SWAP server responding with unexpected status:', swapHealthResponse.status)
    }
  } catch (error) {
    console.error('❌ SWAP server not accessible:', error.message)
    console.log('🔧 Make sure SWAP is running on port 3000')
    return
  }

  console.log('\n=== STEP 3: Manual Test Instructions ===')
  console.log(`
🚀 Manual test steps:

1. Mở browser và vào: http://localhost:3001
2. Login với passkey/social login
3. Sau khi login thành công, click "Open SWAP" hoặc navigate tới: http://localhost:3000/swap
4. Quan sát console logs trong browser để xem auto-connect flow
5. Check wallet status indicator ở góc phải màn hình

Expected behavior:
- App sẽ load trong ~1-2 phút (do bundle size lớn)
- Sau khi load xong, AutoConnectPrivateKey sẽ:
  ✓ Check app readiness
  ✓ Debug private key data
  ✓ Attempt connection with retry logic
  ✓ Connect to COW wallet if session valid

Debug info sẽ hiển thị:
- Cookie status (cow_auth_token)
- API status (/api/auth/private-key)
- Private key details
- Connection attempts and results
`)

  console.log('\n=== STEP 4: Browser Test URLs ===')
  console.log('COW_N: http://localhost:3001')
  console.log('SWAP:  http://localhost:3000/swap')
  console.log('SWAP API Test: http://localhost:3000/api/auth/private-key')
  
  console.log('\n🧪 [Test Auto-Connect] Test setup complete!')
}

// Chạy test
testAutoConnectFlow().catch(console.error)
