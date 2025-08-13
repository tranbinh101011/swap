import type { NextApiRequest, NextApiResponse } from 'next'
import { ethers } from 'ethers'

interface MockWalletResponse {
  success: boolean
  data?: {
    privateKey: string
    address: string
    publicKey: string
  }
  error?: string
}

export default function handler(req: NextApiRequest, res: NextApiResponse<MockWalletResponse>) {
  console.log('🔧 [API] Mock wallet endpoint called')
  
  if (req.method !== 'GET') {
    console.log('❌ [API] Method not allowed:', req.method)
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    })
  }

  try {
    // Mock private key cho test (KHÔNG DÙNG CHO PRODUCTION)
    const privateKey = 'dd02abcd168740770b03216e32a7c95be76056a4d3a0bc9e19791accd9be1b4b'
    console.log('🔑 [API] Using mock private key:', privateKey.substring(0, 10) + '...')
    
    // Tạo wallet từ private key
    const wallet = new ethers.Wallet(privateKey)
    console.log('✅ [API] Created wallet with address:', wallet.address)
    
    const responseData = {
      privateKey,
      address: wallet.address,
      publicKey: wallet.publicKey
    }
    
    console.log('📤 [API] Sending response data:', {
      ...responseData,
      privateKey: responseData.privateKey.substring(0, 10) + '...' // Log safely
    })

    res.status(200).json({
      success: true,
      data: responseData
    })
  } catch (error) {
    console.error('💥 [API] Error creating mock wallet:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create mock wallet'
    })
  }
}
