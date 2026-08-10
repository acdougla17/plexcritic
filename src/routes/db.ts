import { Router } from 'express'
import type { Request, Response, NextFunction } from 'express'
import { clearDatabase, getDatabaseStats } from '../db/database.js'
import { listMedia } from '../db/mediaQueries.js'

const router = Router()

/*****************************************************
 * Database Routes
 *****************************************************/

// Route to fetch all Plex library sections categorized into movies, shows, music, and other
router.get('/remove/:tableName', async (_req: Request, res: Response, _next: NextFunction) => {
  console.log('--- /db/remove/:tableName route called ---')
  if (!_req.params.tableName || typeof _req.params.tableName !== 'string') {
    console.error('Invalid tableName: ', _req.params)
    return
  }
  try {
    const result = await clearDatabase(_req.params.tableName)
    res.send(result)
  } catch (err: unknown) {
    res.statusMessage = err instanceof Error ? err.message : 'Error'
    res.status(503).send()
  }
})

// Route to fetch all Plex library sections categorized into movies, shows, music, and other
router.get('/removeAll/', async (_req: Request, res: Response, _next: NextFunction) => {
  console.log('--- /db/removeAll route called ---')
  try {
    const result = await clearDatabase('ALL')
    res.send(result)
  } catch (err: unknown) {
    res.statusMessage = err instanceof Error ? err.message : 'Error'
    res.status(503).send()
  }
})

router.get('/stats', (_req: Request, res: Response, _next: NextFunction) => {
  console.log('--- /db/stats route called ---')
  try {
    const stats = getDatabaseStats()
    res.send(stats)
  } catch (err: unknown) {
    res.statusMessage = err instanceof Error ? err.message : 'Error'
    res.status(503).send()
  }
})

router.get('/media', (req: Request, res: Response, _next: NextFunction) => {
  try {
    const limitRaw: string | undefined = typeof req.query.limit === 'string' ? req.query.limit : undefined
    const offsetRaw: string | undefined =
      typeof req.query.offset === 'string' ? req.query.offset : undefined

    const limitParsed: number = limitRaw !== undefined ? Number.parseInt(limitRaw, 10) : 50
    const offsetParsed: number = offsetRaw !== undefined ? Number.parseInt(offsetRaw, 10) : 0
    const limit: number =
      Number.isFinite(limitParsed) && limitParsed > 0 ? Math.min(limitParsed, 200) : 50
    const offset: number = Number.isFinite(offsetParsed) && offsetParsed >= 0 ? offsetParsed : 0

    const options: {
      search?: string
      type?: string
      limit: number
      offset: number
    } = { limit, offset }

    if (typeof req.query.search === 'string') {
      options.search = req.query.search
    }
    if (typeof req.query.type === 'string') {
      options.type = req.query.type
    }

    const result = listMedia(options)
    res.json(result)
  } catch (err: unknown) {
    res.statusMessage = err instanceof Error ? err.message : 'Error'
    res.status(503).send()
  }
})

export default router
