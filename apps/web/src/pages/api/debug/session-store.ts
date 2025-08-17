import { NextApiRequest, NextApiResponse } from 'next'
import { sessionStore } from '../../../lib/session-store'

interface DebugResponse {
  totalSessions: number
  sessions: Array<{
    token: string
    hasPrivateKey: boolean
    timestamp: number
    age: string
  }>
  testToken: string
  testTokenExists: boolean
}

export default function handler(req: NextApiRequest, res: NextApiResponse<DebugResponse>) {
  console.log('🔍 [DEBUG-SESSION-STORE] Checking session store status...')
  
  const allSessions: DebugResponse['sessions'] = []
  const testToken = '952ac66b-5a3d-4e6c-9ca4-e635bf86110d'
  
  // Check if sessionStore has sessions property accessible
  let totalSessions = 0
  try {
    totalSessions = sessionStore.size()
    
    // Try to get test session specifically
    const testSession = sessionStore.get(testToken)
    console.log('🧪 [DEBUG] Test session lookup result:', testSession ? 'FOUND' : 'NOT_FOUND')
    
    if (testSession) {
      allSessions.push({
        token: testToken.substring(0, 10) + '...',
        hasPrivateKey: !!testSession.privateKey,
        timestamp: testSession.timestamp,
        age: `${Math.round((Date.now() - testSession.timestamp) / 1000)}s ago`
      })
    }
    
  } catch (error) {
    console.error('🚨 [DEBUG] Error accessing session store:', error)
  }
  
  const response: DebugResponse = {
    totalSessions,
    sessions: allSessions,
    testToken,
    testTokenExists: sessionStore.has(testToken)
  }
  
  console.log('📊 [DEBUG-SESSION-STORE] Response:', response)
  
  res.status(200).json(response)
}
