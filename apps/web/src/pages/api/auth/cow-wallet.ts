import type { NextApiRequest, NextApiResponse } from 'next'
import { sessionStore } from '../../../lib/session-store'  // ✅ FIX: Use correct session store
import crypto from 'crypto'
import { ethers } from 'ethers'

interface CowWalletResponse {
  success: boolean
  authToken?: string    // ✅ Add authToken for URL parameter approach
  sessionId?: string
  redirectUrl?: string
  message?: string
  error?: string
}

export default function handler(req: NextApiRequest, res: NextApiResponse<CowWalletResponse>) {
  console.log('🌐 [CORS] Incoming request:', {
    method: req.method,
    origin: req.headers.origin,
    userAgent: req.headers['user-agent']?.substring(0, 50),
    headers: Object.keys(req.headers),
    url: req.url
  })

  // 🔧 COMPREHENSIVE CORS HEADERS - Fix all CORS issues
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Max-Age', '86400') // 24 hours
  
  // Handle preflight OPTIONS request properly
  if (req.method === 'OPTIONS') {
    console.log('✅ [CORS] Handling preflight OPTIONS request successfully')
    return res.status(200).json({ success: true, message: 'CORS preflight OK' })
  }

  if (req.method !== 'POST') {
    console.log('❌ [CORS] Method not allowed:', req.method)
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed' 
    })
  }

  try {
    console.log('🐄 [SWAP COW Wallet API] Processing COW wallet request...')
    
    // COW_N sends ciphertext and sessionId
    const { ciphertext, sessionId } = req.body

    if (!ciphertext) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing ciphertext' 
      })
    }

    console.log('🔒 [SWAP COW Wallet API] Received ciphertext length:', ciphertext.length)
    console.log('📝 [SWAP COW Wallet API] Session ID:', sessionId)

    // Decrypt the private key using same AES method as COW_N
    const SHARED_SECRET = Buffer.from("COWSwapSecretKey12345678901234567890".slice(0, 32))
    
    function decryptAES(encryptedData: string): string {
      const parts = encryptedData.split(':')
      if (parts.length !== 2) {
        throw new Error('Invalid encrypted data format')
      }
      
      const iv = Buffer.from(parts[0], 'hex')
      const encryptedText = parts[1]
      
      const decipher = crypto.createDecipheriv('aes-256-cbc', SHARED_SECRET, iv)
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
      decrypted += decipher.final('utf8')
      
      return decrypted
    }

    let decryptedPrivateKey: string
    try {
      decryptedPrivateKey = decryptAES(ciphertext)
      console.log('✅ [SWAP COW Wallet API] Successfully decrypted private key:')
      console.log('🔑 [PRIVATE KEY]:', decryptedPrivateKey)
      console.log('🔑 [PRIVATE KEY LENGTH]:', decryptedPrivateKey.length)
    } catch (decryptError) {
      console.error('❌ [SWAP COW Wallet API] Failed to decrypt:', decryptError)
      return res.status(400).json({ 
        success: false,
        error: 'Failed to decrypt private key' 
      })
    }

    // Generate session token for SWAP
    const authToken = crypto.randomUUID()

    // ✅ FIX: Store session data matching the structure expected by private-key API
    // Extract wallet address from private key
    let walletAddress = 'unknown'
    try {
      const wallet = new ethers.Wallet(decryptedPrivateKey)
      walletAddress = wallet.address
      console.log('🔑 [SWAP COW Wallet API] Extracted wallet address:', walletAddress)
    } catch (e) {
      console.warn('⚠️ [SWAP COW Wallet API] Could not extract address:', e)
    }

    // Store session with correct structure for private-key API lookup
    sessionStore.set(authToken, {
      privateKey: decryptedPrivateKey,  // ✅ Store decrypted private key
      timestamp: Date.now(),
      address: walletAddress           // ✅ Store wallet address
    })

    console.log('💾 [SWAP COW Wallet API] Session stored with token:', authToken)
    console.log('💾 [SWAP COW Wallet API] Session data:', {
      hasPrivateKey: !!decryptedPrivateKey,
      address: walletAddress,
      timestamp: Date.now()
    })

    // ✅ SOLUTION 1: Return authToken for URL parameter (no cross-origin cookie issues)
    console.log('🔑 [SWAP COW Wallet API] Returning authToken for URL parameter approach')
    console.log('✅ [SWAP COW Wallet API] Session created successfully')
    
    return res.status(200).json({
      success: true,
      authToken: authToken,  // ✅ Return token for URL parameter
      sessionId: sessionId || authToken,
      message: 'Session created - use URL parameter for auth'
    })

  } catch (error) {
    console.error('[SWAP COW Wallet API] Error:', error)
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    })
  }
}