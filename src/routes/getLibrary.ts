import { Router } from 'express'
import type { Request, Response, NextFunction } from 'express'
import { getPlexLibrary } from '../connectors/plex.js'

const router = Router()

router.get('/', async (_req: Request, res: Response, _next: NextFunction) => {
  console.log('--- getLibrary route called ---')
  try {
    const library = await getPlexLibrary()
    res.send(library)
  } catch (err: unknown) {
    res.statusMessage = err instanceof Error ? err.message : 'Error'
    res.status(503).send()
  }
})

export default router
