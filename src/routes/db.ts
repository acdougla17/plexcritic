import { Router } from 'express'
import type { Request, Response, NextFunction } from 'express'
import { clearDatabase } from '../db/database.js'

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


export default router
