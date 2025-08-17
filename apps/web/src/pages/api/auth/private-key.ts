import { NextApiRequest, NextApiResponse } from 'next'
import { sessionStore } from '../../../lib/session-store'
import crypto from 'crypto'

interface PrivateKeyResponse {
  success: boolean
  privateKey?: string
  error?: string
}

export default function handler(req: NextApiRequest, res: NextApiResponse<PrivateKeyResponse>) {
  console.log('🔑 [PRIVATE-KEY-API] === REQUEST RECEIVED ===')
  console.log('🔑 [PRIVATE-KEY-API] Method:', req.method)
  console.log('🔑 [PRIVATE-KEY-API] URL:', req.url)
  console.log('🔑 [PRIVATE-KEY-API] Query params:', req.query)
  
  // 🔧 COMPREHENSIVE CORS HEADERS - Fix all CORS issues
  res.setHeader('Access-Control-Allow-Origin', '*') // Allow all origins for API
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Max-Age', '86400') // 24 hours
  
  // Handle preflight OPTIONS request properly
  if (req.method === 'OPTIONS') {
    console.log('🔧 [CORS] Handling preflight OPTIONS request for private-key API')
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed' 
    })
  }

  try {
    console.log('🔑 [SWAP Private Key API] Processing private key request...')
    
    // ✅ SOLUTION 1: Get auth token from URL parameter instead of cookie
    const authToken = req.query.auth as string || req.query.token as string || req.cookies.cow_auth_token
    
    console.log('🔍 [SWAP Private Key API] Auth token from query.auth:', req.query.auth)
    console.log('🔍 [SWAP Private Key API] Auth token from query.token:', req.query.token)
    console.log('🔍 [SWAP Private Key API] Final authToken:', authToken)
    
    if (!authToken) {
      console.error('[SWAP Private Key API] No auth token found in URL param or cookie')
      console.log('🔍 [SWAP Private Key API] Query params:', req.query)
      console.log('🍪 [SWAP Private Key API] Cookies:', req.cookies)
      return res.status(401).json({ 
        success: false,
        error: 'No authentication token' 
      })
    }

    console.log(`🔍 [SWAP Private Key API] Looking up session with token: ${authToken.substring(0, 8)}...`)
    console.log('🔍 [SWAP Private Key API] Token source:', req.query.auth ? 'query.auth' : req.query.token ? 'query.token' : 'Cookie')

    // 🔍 DEBUG: Check SessionStore status
    console.log('🔍 [DEBUG] SessionStore status:', {
      totalSessions: sessionStore.size(),
      hasTestToken: sessionStore.has(authToken),
      testTokenSpecific: sessionStore.has('952ac66b-5a3d-4e6c-9ca4-e635bf86110d')
    })

    // Get session data
    const sessionData = sessionStore.get(authToken)
    
    console.log('📝 [SWAP Private Key API] Session lookup result:', {
      found: !!sessionData,
      hasPrivateKey: sessionData?.privateKey ? 'YES' : 'NO',
      timestamp: sessionData?.timestamp,
      address: sessionData?.address
    })
    
    if (!sessionData) {
      console.error('[SWAP Private Key API] Invalid or expired session')
      return res.status(401).json({ 
        success: false,
        error: 'Invalid or expired session' 
      })
    }

    console.log('✅ [SWAP Private Key API] Session found, returning private key')
    
    return res.status(200).json({
      success: true,
      privateKey: sessionData.privateKey
    })

  } catch (error) {
    console.error('[SWAP Private Key API] Error:', error)
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    })
  }
}
