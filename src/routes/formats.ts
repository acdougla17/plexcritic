import { Router } from 'express'
import type { Request, Response, NextFunction } from 'express'
import { getFormatPreferences } from '../config/formatPreferences.js'
import { getFormatSummary, getTranscodeCandidates } from '../db/formatQueries.js'

const router = Router()

router.get('/summary', (_req: Request, res: Response, _next: NextFunction) => {
  try {
    const summary = getFormatSummary()
    res.json(summary)
  } catch (err: unknown) {
    res.statusMessage = err instanceof Error ? err.message : 'Error'
    res.status(503).send()
  }
})

router.get('/candidates', (req: Request, res: Response, _next: NextFunction) => {
  try {
    const limitRaw: string | undefined = typeof req.query.limit === 'string' ? req.query.limit : undefined
    const offsetRaw: string | undefined =
      typeof req.query.offset === 'string' ? req.query.offset : undefined

    const limitParsed: number = limitRaw !== undefined ? Number.parseInt(limitRaw, 10) : 100
    const offsetParsed: number = offsetRaw !== undefined ? Number.parseInt(offsetRaw, 10) : 0

    const limit: number = Number.isFinite(limitParsed) && limitParsed > 0 ? Math.min(limitParsed, 500) : 100
    const offset: number = Number.isFinite(offsetParsed) && offsetParsed >= 0 ? offsetParsed : 0

    const candidates = getTranscodeCandidates({ limit, offset })
    res.json({
      limit,
      offset,
      count: candidates.length,
      candidates,
    })
  } catch (err: unknown) {
    res.statusMessage = err instanceof Error ? err.message : 'Error'
    res.status(503).send()
  }
})

router.get('/preferences', (_req: Request, res: Response, _next: NextFunction) => {
  try {
    res.json(getFormatPreferences())
  } catch (err: unknown) {
    res.statusMessage = err instanceof Error ? err.message : 'Error'
    res.status(503).send()
  }
})

export default router
