import type { NextApiRequest, NextApiResponse } from 'next'
import { sessionStore } from '../../stores/session-store'
import { ethers } from 'ethers'
import * as crypto from 'crypto'

// Define the private key for RSA decryption (matching COW_N)
const privateKey = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCi1RFwv8zYlHvF
tKMYpK8k2l8hL3JDTOv8k/wgcx8kE5q3z7vLbSXyMxfZwRqN+K4HnYJ2dKYH1z8N
dQwE2YPqKhHqOAb1vJFB3XZhKjY4XNdOaZvVq8MmC2L3yN9mFNiSX0C5tP4IYt9Z
kFKWQHnJ5xYtRZqLEE9z+k7vqcKxJNa2HNTBcB4EYa5nMNcAbpOiKJLZOJZD5kK9
9vL7nKRRlr4YnXqLvP8aJvZKa6cPL2i5kUeBJV8P5i1vY7d9AjPJzH4oW6pAEKcT
NMLR7h2qOkpDnFWa2iK9yXhKgpnQTOCxn8MjQWc8x4vLJdH9Q6BnhQZdYFZtJ8O9
kY6B9xLBAgMBAAECggEAJRZbWl3rFQczYmPfXXA2N8LqXYkd5xXm7UfZZQ1vJpFP
5bYzV8e+oHhQ9HpCcYqJ2mBYzFw6oX8VxqLz7L3AqF8ZkxpY1EYnYzE4LhWKoF3C
sPJQzGKVUvB9B4zB7dV2rZKcR8VhQa6d1qzk8bQmCf3LkM4o+Y2JnGY7hF9w5XqR
4F8zAa6zJKQGZlh6QxhgYGt9P3HNAb8Q3vL8yY8zF9QgYjF6+J5bE3hOp7bNzCxJ
hqhJ4oZ9QSz4B5c2V4Y3dH9A9Z1P7C2m9nK3rO5L3BjZHjQJz7A4QKz8Fm6b+A3Z
jW4yYJx5iY6H8DjLsP3Y4B8Q7rZ1s5kYjZ6eW7xqwQKBgQDT5bCxGy8Nw6sQ4H9a
9PcRkZ7x6fQbF2R5yJzQp9aP4yMx3+GdTlY8wB7YZLfMbP8zQwE8kJ3z5ZbYqVbM
ZJ1bMqVh8DfF3xGz8QjPQjCJ8Q5zEYPzQhwJF8v9sZbX4Gx1Yb6qDkYtB5E8sP3o
9yOjJ8QsXzQd5y2A1V3RhwgqTQKBgQDFJ1Ej8xKnY6C5Bz7fN4RGz8LbzA2lY3qT
3gZjQa1Jt9h5W7VmHPzD8F1WfGz9Nx+Q2H5cBbP8F9d7tR2qL5kZyY6vB3xQj8O7
p1c4fT1Jb8Yh9XkdGz2Y6B8Q7J6fB1tQ3cXz5nJ4M9LpCfY3D1tE8sB5xA1YqR9K
MmJ6Y3cSQQKBgQCzH5Y8lQ4nRzP6T8uY3x7zH8cP1F9nA6Gg7E3qZ4J8C2mB5tR7
wV3sFzQb8Y6J1cX5gQ2z3H8tT6Rz1L7nQ4zB8Y9tK6F5sR7L3X8Y9gH6cB2V1j4z
Q8sL3Y9hP6fC1R8tB5oJ6nS7V3qE8L9Y2H1xT4Z7sG9F3R6zC8K5B1JpQ8qL5QKB
gDJQ8yZ6a3F4T7uR9nCxQ1L8oP6mA5J2B8Y3sR7zF9xQ6V1K8dC3H5yT2E7wJ1nG
4B9zQ5L7sP3Y8H1tR6nF4zQ2K8oJ5B6C7Y3L9sR1tP4QYpW5Y3J8d2oG6hF9sT3E
7xQ1Z8nK4C5B7Y2L9sR3tP6F1qJ8mA4oY5T7K6zQ8sL3B9xR1hQwN7V4QKBgDkj
A5oL3Y7zQ9sF8H1tR6P3E2B4Y5K8L7nC9Q3xG6J1sT4Z7oP8A2F9yV6K3L5B8Q7R
1Y2J9dE3F6zS8L4V7Y1B9xQ6H3sT2nP5K8oJ7A4C1L9zR3E6Y8sB2Q7F4T1Z5Y3q
JkYtB5E8sP3o9yOjJ8QsXzQd5y2A1V3RhwgqTQ==
-----END PRIVATE KEY-----`

interface CowWalletResponse {
  success: boolean
  data?: {
    privateKey?: string
    address?: string
    connector?: any
  }
  error?: string
}

function setCorsHeaders(res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3001')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Max-Age', '86400')
}

export default function handler(req: NextApiRequest, res: NextApiResponse<CowWalletResponse>) {
  console.log('🔧 [COW-WALLET API] Request received:', {
    method: req.method,
    origin: req.headers.origin,
    userAgent: req.headers['user-agent']
  })

  // Set CORS headers for all requests
  setCorsHeaders(res)

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    console.log('📋 [COW-WALLET API] Handling OPTIONS preflight request')
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    console.log('❌ [COW-WALLET API] Method not allowed:', req.method)
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    })
  }

  try {
    const { token } = req.body
    
    if (!token) {
      console.log('❌ [COW-WALLET API] Missing token')
      return res.status(400).json({
        success: false,
        error: 'Token is required'
      })
    }

    console.log('🔑 [COW-WALLET API] Processing token:', token.substring(0, 10) + '...')
    
    // Get session data
    const sessionData = sessionStore.getSession(token)
    if (!sessionData) {
      console.log('❌ [COW-WALLET API] Session not found for token')
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      })
    }

    console.log('✅ [COW-WALLET API] Session found:', {
      hasEncryptedKey: !!sessionData.encryptedPrivateKey,
      keyLength: sessionData.encryptedPrivateKey?.length
    })

    // Decrypt the private key
    const decryptedKey = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256'
      },
      Buffer.from(sessionData.encryptedPrivateKey, 'base64')
    ).toString('utf8')

    console.log('🔓 [COW-WALLET API] Private key decrypted successfully')

    // Create wallet and get address
    const wallet = new ethers.Wallet(decryptedKey)
    const address = wallet.address

    console.log('👛 [COW-WALLET API] Wallet created:', {
      address,
      keyPrefix: decryptedKey.substring(0, 6) + '...'
    })

    // Create a simple connector object
    const connector = {
      id: 'cow-wallet',
      name: 'COW Wallet',
      type: 'cow-wallet',
      ready: true,
      icon: 'https://example.com/cow-icon.png'
    }

    // Store the private key in session for later use
    sessionData.decryptedPrivateKey = decryptedKey
    sessionStore.setSession(token, sessionData)

    console.log('✅ [COW-WALLET API] Response prepared successfully')

    return res.status(200).json({
      success: true,
      data: {
        privateKey: decryptedKey,
        address: address,
        connector: connector
      }
    })

  } catch (error) {
    console.error('💥 [COW-WALLET API] Error:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    })
  }
}
