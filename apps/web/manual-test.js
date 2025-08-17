// Test script để test auto-connect với auth token
const crypto = require('crypto')

const testAuthToken = crypto.randomUUID()
console.log('Generated test auth token:', testAuthToken)

console.log('\n🧪 Manual Test Steps:')
console.log('1. Truy cập COW_N: http://localhost:3001')
console.log('2. Click swap button để redirect sang SWAP')
console.log('3. Hoặc test trực tiếp với URL:')
console.log(`   http://localhost:3000/swap?auth=${testAuthToken}`)
console.log('\n4. Mở Developer Console và chạy:')
console.log('   window.autoConnectDebug.runAllTests()')
console.log('\n5. Kiểm tra console logs để debug auto-connect')
