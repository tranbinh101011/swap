interface SessionData {
  privateKey: string
  timestamp: number
  address: string
}

class SessionStore {
  private sessions = new Map<string, SessionData>()

  set(token: string, data: SessionData) {
    console.log(`📝 [SessionStore] Setting session: ${token}`)
    this.sessions.set(token, data)
    
    // Auto cleanup after 30 minutes
    setTimeout(() => {
      this.delete(token)
    }, 30 * 60 * 1000)
  }

  get(token: string): SessionData | undefined {
    console.log(`🔍 [SessionStore] Getting session: ${token}`)
    return this.sessions.get(token)
  }

  delete(token: string) {
    console.log(`🗑️ [SessionStore] Deleting session: ${token}`)
    this.sessions.delete(token)
  }

  has(token: string): boolean {
    return this.sessions.has(token)
  }

  clear() {
    console.log('🧹 [SessionStore] Clearing all sessions')
    this.sessions.clear()
  }

  size(): number {
    return this.sessions.size
  }
}

export const sessionStore = new SessionStore()

// Add test session for debugging immediately - FORCE LOAD
console.log('🧪 [SessionStore] Force loading test data...')
sessionStore.set('952ac66b-5a3d-4e6c-9ca4-e635bf86110d', {
  privateKey: '0x9e0dc0807b1c0417c362cfd235c5dff7c0933f1a95fd70d1f459bbddad428c9f',
  timestamp: Date.now(),
  address: '0x742d35Cc6C27F6D9CC6DBD7A3e9b0ad03b7b45f0'
})
console.log('🧪 [SessionStore] Test data loaded! Total sessions:', sessionStore.size())
console.log('🧪 [SessionStore] Test token exists:', sessionStore.has('952ac66b-5a3d-4e6c-9ca4-e635bf86110d'))
