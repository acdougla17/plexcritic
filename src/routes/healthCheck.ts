import { Router } from 'express'
import type { Request, Response, NextFunction } from 'express'

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

export default router
