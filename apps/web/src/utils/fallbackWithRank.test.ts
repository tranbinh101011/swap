import { createServer, RequestListener } from 'node:http'
import { AddressInfo } from 'node:net'
import { http } from 'viem'
import { bsc, bscTestnet } from 'viem/chains'
import { Transport } from 'wagmi'
import { fallbackWithRank, rankTransports } from './fallbackWithRank'

function createHttpServer(handler: RequestListener): Promise<{ close: () => Promise<unknown>; url: string }> {
  const server = createServer(handler)

  const closeAsync = () =>
    new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve(undefined))))

  return new Promise((resolve) => {
    server.listen(() => {
      const { port } = server.address() as AddressInfo
      resolve({ close: closeAsync, url: `http://localhost:${port}` })
    })
  })
}

describe('rankTransports', () => {
  test('should not rank for testnet', async () => {
    const server = await createHttpServer((_req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ result: '0x1' }))
    })

    const localTransport = http(server.url)
    const mockFn = vi.fn()

    rankTransports({
      chain: bscTestnet,
      onTransports: mockFn,
      transports: [localTransport],
    })

    expect(mockFn).toHaveBeenCalledTimes(0)
  })
  test('should rank for mainnet chain', async () => {
    const server = await createHttpServer((_req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ result: '0x1' }))
    })

    const localTransport = http(server.url)
    const mockFn = vi.fn()

    rankTransports({
      chain: bsc,
      onTransports: mockFn,
      transports: [localTransport],
    })

    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(mockFn).toHaveBeenCalledTimes(1)
  })
  test('should rank with scores', async () => {
    const server1 = await createHttpServer((_req, res) => {
      setTimeout(() => {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ result: '0x1' }))
      }, 1)
    })
    const server100 = await createHttpServer((_req, res) => {
      setTimeout(() => {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ result: '0x1' }))
      }, 100)
    })
    const serverFailed = await createHttpServer((_req, res) => {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Internal Server Error' }))
    })

    const transport1 = http(server1.url, { key: 'transport1' })
    const transport100 = http(server100.url, { key: 'transport100' })
    const transportFailed = http(serverFailed.url, { key: 'transportFailed' })

    const mockFn = vi.fn().mockImplementation((newTransports: Transport[]) => {
      expect(newTransports).toHaveLength(3)
      const rankedKeys = newTransports.map((t) => t({ chain: undefined }).config.key)
      expect(rankedKeys).toEqual(['transport1', 'transport100', 'transportFailed'])
    })

    rankTransports({
      chain: bsc,
      onTransports: mockFn,
      transports: [transportFailed, transport100, transport1],
    })

    await new Promise((resolve) => setTimeout(resolve, 100))
  })
})

describe('fallbackWithRank', () => {
  test('should fallback and re-rank after 429', async () => {
    let shouldRateLimit = false
    let server0Calls = 0
    let server1Calls = 0
    const server0 = await createHttpServer((_req, res) => {
      server0Calls++
      setTimeout(() => {
        if (shouldRateLimit) {
          res.writeHead(429, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Rate limit exceeded' }))
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ result: '0x1' }))
        }
      }, 1)
    })
    const server1 = await createHttpServer((_req, res) => {
      server1Calls++
      setTimeout(() => {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ result: '0x1' }))
      }, 50)
    })

    const transport0 = http(server0.url, { key: 'transport0' })
    const transport1 = http(server1.url, { key: 'transport1' })

    const transport = fallbackWithRank([transport1, transport0], { retryCount: 0 })({ chain: bsc, retryCount: 0 })

    await new Promise((resolve) => setTimeout(resolve, 100))

    expect([server0Calls, server1Calls]).toEqual([1, 1]) // initial rank

    await transport.request({ method: 'eth_chainId' })

    // current rank should be [transport0, transport1], and manual request increases calls
    expect([server0Calls, server1Calls]).toEqual([2, 1])

    shouldRateLimit = true

    await transport.request({ method: 'eth_chainId' }).catch((error) => {
      expect(error).toBeInstanceOf(Error)
      expect(error.message).toContain('Rate limit exceeded')
    })

    await new Promise((resolve) => setTimeout(resolve, 110))

    expect([server0Calls, server1Calls]).toEqual([4, 3])
    // server0+2: 1 for manual request, 1 for re-rank after 429
    // server1+2: 1 for fallback retry after 429, 1 for re-rank after 429

    shouldRateLimit = false

    await transport.request({ method: 'eth_chainId' })
    await new Promise((resolve) => setTimeout(resolve, 110))

    expect([server0Calls, server1Calls]).toEqual([4, 4]) // as previous rank, server1 is the faster one
  })
})
