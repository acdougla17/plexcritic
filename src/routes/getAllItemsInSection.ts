import { Router } from 'express'
import type { Request, Response, NextFunction } from 'express'
import { getAllItemsInSection } from '../connectors/plex.js'

const router = Router()

router.get('/:sectionKey', async (_req: Request, res: Response, _next: NextFunction) => {
  console.log('--- getAllItemsInSection route called ---')
  if (!_req.params.sectionKey || typeof _req.params.sectionKey !== 'string') {
    console.log(_req.params)
    res.statusMessage = 'Invalid sectionKey'
    res.status(400).send()
    return
  }

  try {
    const library = await getAllItemsInSection(_req.params.sectionKey)
    res.send(library)
  } catch (err: unknown) {
    res.statusMessage = err instanceof Error ? err.message : 'Error'
    res.status(503).send()
  }
})

export default router
