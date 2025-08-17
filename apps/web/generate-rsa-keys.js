// Generate new compatible RSA key pair
const crypto = require('crypto')

console.log("=== Generating New RSA Key Pair ===")

// Generate 3072-bit RSA key pair (safe and compatible)
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 3072,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem'
  }
})

console.log("✅ New RSA Key Pair Generated")

// Test the new keys
const testMessage = "0x9e0dc0807b1c0417c362cfd235c5dff7c0933f1a95fd70d1f459bbddad428c9f"

try {
  console.log("\n=== Testing New Keys ===")
  
  const encrypted = crypto.publicEncrypt({
    key: publicKey,
    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
    oaepHash: 'sha256'
  }, Buffer.from(testMessage, 'utf8'))
  
  console.log("✅ Encryption successful. Ciphertext length:", encrypted.length)
  
  const decrypted = crypto.privateDecrypt({
    key: privateKey,
    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
    oaepHash: 'sha256'
  }, encrypted)
  
  const decryptedText = decrypted.toString('utf8')
  console.log("✅ Decryption successful:", decryptedText === testMessage)
  console.log("Decrypted:", decryptedText)
  
  // Generate base64 encoded keys for .env files
  const publicKeyBase64 = Buffer.from(publicKey).toString('base64')
  const privateKeyBase64 = Buffer.from(privateKey).toString('base64')
  
  console.log("\n=== Base64 Encoded Keys ===")
  console.log("🔑 PUBLIC KEY (for COW_N .env.local):")
  console.log(`NEXT_PUBLIC_SWAP_PUBLIC_KEY_BASE64="${publicKeyBase64}"`)
  
  console.log("\n🔐 PRIVATE KEY (for SWAP .env.local):")
  console.log(`SWAP_PRIVATE_KEY_BASE64="${privateKeyBase64}"`)
  
} catch (error) {
  console.error("❌ Test failed:", error)
}
