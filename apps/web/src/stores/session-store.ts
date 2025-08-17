// Session storage for cross-application communication
interface SessionData {
  ciphertext: string
  sessionId: string
  timestamp: number
}

class SessionStore {
  private sessions = new Map<string, SessionData>()
  private readonly EXPIRY_TIME = 2 * 60 * 60 * 1000 // 2 hours (longer for persistence)

  setSession(token: string, data: SessionData) {
    this.sessions.set(token, {
      ...data,
      timestamp: Date.now()
    })
    console.log('📝 [SWAP SESSION-STORE] Session saved:', {
      token: token.substring(0, 10) + '...',
      sessionId: data.sessionId,
      hasCiphertext: !!data.ciphertext
    })
  }

  getSession(token: string): SessionData | null {
    const session = this.sessions.get(token)
    
    if (!session) {
      console.log('❌ [SWAP SESSION-STORE] Session not found for token:', token.substring(0, 10) + '...')
      return null
    }

    // Check if session has expired
    if (Date.now() - session.timestamp > this.EXPIRY_TIME) {
      console.log('⏰ [SWAP SESSION-STORE] Session expired for token:', token.substring(0, 10) + '...')
      this.sessions.delete(token)
      return null
    }

    console.log('✅ [SWAP SESSION-STORE] Session retrieved:', {
      token: token.substring(0, 10) + '...',
      sessionId: session.sessionId,
      age: Date.now() - session.timestamp
    })
    return session
  }

  deleteSession(token: string) {
    const deleted = this.sessions.delete(token)
    console.log('🗑️ [SWAP SESSION-STORE] Session deleted:', {
      token: token.substring(0, 10) + '...',
      existed: deleted
    })
    return deleted
  }

  clearExpiredSessions() {
    const now = Date.now()
    let deletedCount = 0
    
    for (const [token, session] of this.sessions.entries()) {
      if (now - session.timestamp > this.EXPIRY_TIME) {
        this.sessions.delete(token)
        deletedCount++
      }
    }
    
    if (deletedCount > 0) {
      console.log('🧹 [SWAP SESSION-STORE] Cleared expired sessions:', deletedCount)
    }
    
    return deletedCount
  }

  getAllSessions() {
    return Array.from(this.sessions.entries()).map(([token, data]) => ({
      token: token.substring(0, 10) + '...',
      sessionId: data.sessionId,
      age: Date.now() - data.timestamp,
      expired: Date.now() - data.timestamp > this.EXPIRY_TIME
    }))
  }

  getSessionsCount() {
    return this.sessions.size
  }
}

// Export singleton instance
export const sessionStore = new SessionStore()

// Auto cleanup every 5 minutes
setInterval(() => {
  sessionStore.clearExpiredSessions()
}, 5 * 60 * 1000)
