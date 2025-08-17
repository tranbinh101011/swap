// Debug RSA keys compatibility
const crypto = require('crypto')

// Test current key formats
const swapPrivateKeyBase64 = "LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tCk1JSUZPd1RSQXdFSEtvWklodmNOQVFFQkFRSUZBREFOQmdrcWhraUc5dzBCQVFFRkFBT0NBZzhBTUlJQmlnS0MKQVlFQTI4RG1yalhWc2puVWxxZG5mWXg3MHpEUS8yaGpOY3lQOWZQRnE4aFlic3FlWWdoT09ub1VSUUFKMDNBKwpGR2RLNlNRUzBpV2xvbWo4S1dIVlVzNlMzL1hTQzEyZVNTOWhRSXI4ejQ3eFJhM1RENkt4WW55cHRXeVpxWitHClNWNTRTMkhLYmFBQTBrQU1QRXJESXhwOTFLZ3JZNGpETDhsaG5qUktzdmVIeXdZOGR5UFVWVG9XMmlUd2JsaUoKaUIvT1pxTmlsUFNTNitYNUNJRlphOG1SZDlVRFdGTVFUQmhqdzI4RUFmUHllQnkvN1ZUNklCY0JNZzdndzBHRApUUnVhOFdpQlhRcjFQUWhsZlVsb2ExU2ZaVks4TGRzNHA5QkJTcE9KRVg2c2V6aDdoNkFHc1dKNHJQSU9FQUUvCks4WHhVeVd0UXl1V0VXdUVUOUIxTlFkRnBINmRudVNBTzVhWDJ1Rzl2ZldBV0tLUmUrcm5YZ3V5aldTbk5KenkKM0VhdjFURCtGandQYS9zYjNPSEdzdHBEamQzSFZuUTc5Wko3YVhkdklpN3ZRSStQZDdWYTUrRGpuNWZ4WDQ0RQpMTktPTjAxVDlMUld5andOcWRrWmdxWDRiWkJpOE5vdSt5bE5VMEtMNFhmOENxWloyTHk4cmMyVmZUUENOc0hFCjUvMXJBZ01CQUFFQ2dnR0FUdjQxdmx5d09VV1hJZFl1MFFBOFViTmR1cmM5S1Y5WFVLd05CZUtvVlhWRXNIa1gKRnpGUjlLVTlPOGZOVVYvRklEeWVnZnVTa1kzTzVhQmJwTlJTM0JqWmFQM2xxU1VnRmpINEZpeTJ0OUdHWmZpbQpiVGZOeDk1RERxNEZ3ajRENWJWKzE2RkJ6NkZCeUpJSVdXQlBHL3FGcGN3QjV2YzBuR1hmWVFmblFBejhXblpOCmpHOWRPWmE5TlY4QjFqM3MxVGlRM1lmbTFRTzNNUHlqV3Q4M1BrZE5qTzRZOXY5R085RFp3OEh0cXNJRkJGNjYKaHdKczFyRUs5SkJZSGc3dGtwSzc5NkhJS25YcVBTVVJreU9WVmRmbWIrWDE3dFRwbTdoajJFV2o4Rlg2MEVXbwp3VlpMRDFHS0pUM0VGZElrQnZXRTJ0L1V0QlIrajFwNGlxTUNJMUVHbSttRjdkME9uUWpRZSsxNVo5c3J6cnJuCkNjOUhTZStpL01vNkNKbFRQTGN5NU5LOUR1dU5VVTFEb3BaUlFlQW5LZ3AvSy8xYk5tdDY3VXhmUVVIRTZCK1oKMmZMVXJhRXUva1J2em1rT1lsaU81RStTcUk1MXB3b0g5T04vNVBJdXhoWlpHblpucDl5YnRGMU5aMTQ2UXFiUQpCWnVZWXR0eElhQndJQ3JzaXluc0ViRUYKLS0tLS1FTkQgUFJJVkFURSBLRVktLS0tLQo="

const swapPublicKeyBase64 = "LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUlJQm9qQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FZOEFNSUlCaWdLQ0FZRUEyOERtcmpYVnNqblVscWRuZll4NwowekRRLzJoak5jeVA5ZlBGcThoWWJzcWVZZ2hPT25vVVJRQUowM0ErRkdkSzZTUVMwaVdsb21qOEtXSFZVczZTCjMvWFNDMTJlU1M5aFFJcjh6NDd4UmEzVEQ2S3hZbnlwdFd5WnFaK0dTVjU0UzJIS2JhQUEwa0FNUEVyREl4cDkKMUtnclk0akRMOGxobmpSS3N2ZUh5d1k4ZHlQVVZUb1cyaVR3YmxpSmlCL09acU5pbFBTUzYrWDVDSUZaYThtUgpkOVVEV0ZNUVRCaGp3MjhFQWZQeWVCeS83VlQ2SUJjQk1nN2d3MEdEVFJ1YThXaUJYUXIxUFFobGZVbG9hMVNmClpWSzhMZHM0cDlCQlNwT0tFWDZzZXpoN2g2QUdzV0o0clBJT0VBRS9LOFh4VXlXdFF5dVdFV3VFVDlCMU5RZEYKcEg2ZG51U0FPNWFYMnVHOXZmV0FXS0tSZStyblhndXlqV1NuTkp6eTNFYXYxVEQrRmp3UGEvc2IzT0hHc3RwRApqZDNIVm5RNzlaSjdhWGR2SWk3dlFJK1BkN1ZhNStEam41ZnhYNDRFTE5LT04wMVQ5TFJXeWp3TnFka1pncVg0CmJaQmk4Tm91K3lsTlUwS0w0WGY4Q3FaWjJMeThyYzJWZlRQQ05zSEU1LzFyQWdNQkFBRT0KLS0tLS1FTkQgUFVCTElDIEtFWS0tLS0tCg=="

console.log("=== RSA Key Format Debug ===")

try {
  // Decode keys
  const privateKeyPem = Buffer.from(swapPrivateKeyBase64, 'base64').toString('utf8')
  const publicKeyPem = Buffer.from(swapPublicKeyBase64, 'base64').toString('utf8')
  
  console.log("Private Key Format:")
  console.log(privateKeyPem.substring(0, 50) + "...")
  
  console.log("Public Key Format:")
  console.log(publicKeyPem.substring(0, 50) + "...")
  
  // Test encryption/decryption with different padding options
  const testMessage = "0x9e0dc0807b1c0417c362cfd235c5dff7c0933f1a95fd70d1f459bbddad428c9f"
  
  console.log("\n=== Testing RSA OAEP ===")
  try {
    const encrypted = crypto.publicEncrypt({
      key: publicKeyPem,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256'
    }, Buffer.from(testMessage, 'utf8'))
    
    console.log("✅ Encryption successful. Ciphertext length:", encrypted.length)
    
    const decrypted = crypto.privateDecrypt({
      key: privateKeyPem,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256'
    }, encrypted)
    
    console.log("✅ Decryption successful:", decrypted.toString('utf8') === testMessage)
    
  } catch (error) {
    console.log("❌ OAEP Error:", error.code, error.reason)
  }
  
  console.log("\n=== Testing RSA PKCS1 ===")
  try {
    const encrypted = crypto.publicEncrypt({
      key: publicKeyPem,
      padding: crypto.constants.RSA_PKCS1_PADDING
    }, Buffer.from(testMessage, 'utf8'))
    
    console.log("✅ PKCS1 Encryption successful. Ciphertext length:", encrypted.length)
    
    const decrypted = crypto.privateDecrypt({
      key: privateKeyPem,
      padding: crypto.constants.RSA_PKCS1_PADDING
    }, encrypted)
    
    console.log("✅ PKCS1 Decryption successful:", decrypted.toString('utf8') === testMessage)
    
  } catch (error) {
    console.log("❌ PKCS1 Error:", error.code, error.reason)
  }
  
  console.log("\n=== Testing with NO oaepHash ===")
  try {
    const encrypted = crypto.publicEncrypt({
      key: publicKeyPem,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING
    }, Buffer.from(testMessage, 'utf8'))
    
    console.log("✅ No oaepHash Encryption successful. Ciphertext length:", encrypted.length)
    
    const decrypted = crypto.privateDecrypt({
      key: privateKeyPem,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING
    }, encrypted)
    
    console.log("✅ No oaepHash Decryption successful:", decrypted.toString('utf8') === testMessage)
    
  } catch (error) {
    console.log("❌ No oaepHash Error:", error.code, error.reason)
  }
  
} catch (error) {
  console.error("❌ Fatal error:", error)
}
