import { describe, it, expect } from 'vitest'
import express from 'express'
import request from 'supertest'
import healthRouter from '../healthCheck.js'

// We mount just the router under test on a throwaway express app rather
// than importing src/index.ts, since index.ts calls app.listen() as a
// side effect of being imported (which would try to bind a real port
// during the test run).
function buildTestApp() {
  const app = express()
  app.use('/health', healthRouter)
  return app
}

describe('GET /health', () => {
  it('returns 200 with an uptime and OK message', async () => {
    const app = buildTestApp()
    const res = await request(app).get('/health')

    expect(res.status).toBe(200)
    expect(res.body.message).toBe('OK')
    expect(res.body.uptime).toBeGreaterThanOrEqual(0)
    expect(typeof res.body.timestamp).toBe('number')
  })
})
