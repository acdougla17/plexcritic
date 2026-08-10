import { Router } from 'express'
import type { Request, Response, NextFunction } from 'express'
import { getSyncHealth } from '../db/mediaQueries.js'

const router = Router()

router.get('/', async (_req: Request, res: Response, _next: NextFunction) => {
  console.log('--- Health route called ---')
  const healthcheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
  }

  try {
    res.send(healthcheck)
    console.log(healthcheck)
  } catch (err: unknown) {
    healthcheck.message = err instanceof Error ? err.message : 'Error'
    res.status(503).send()
    console.error('Health check failed:', healthcheck)
  }
})

router.get('/sync', (req: Request, res: Response, _next: NextFunction) => {
  try {
    const limitRaw: string | undefined = typeof req.query.limit === 'string' ? req.query.limit : undefined
    const limitParsed: number = limitRaw !== undefined ? Number.parseInt(limitRaw, 10) : 25
    const limit: number =
      Number.isFinite(limitParsed) && limitParsed > 0 ? Math.min(limitParsed, 200) : 25

    res.json(getSyncHealth(limit))
  } catch (err: unknown) {
    res.statusMessage = err instanceof Error ? err.message : 'Error'
    res.status(503).send()
  }
})

export default router
