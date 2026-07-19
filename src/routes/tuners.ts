import { Router } from 'express'
import type { Request, Response, NextFunction } from 'express'
import { getAllTuners, removeTuner } from '../connectors/plex.js'

const router = Router()

/*****************************************************
 * Plex Tuners Routes
 *****************************************************/

// Route to fetch all Plex Tuner devices
router.get('/', async (_req: Request, res: Response, _next: NextFunction) => {
  console.log('--- /tuners route called ---')
  try {
    const tuners = await getAllTuners()
    res.send(tuners)
  } catch (err: unknown) {
    res.statusMessage = err instanceof Error ? err.message : 'Error'
    res.status(503).send()
  }
})

// Remove a tuner device from the system
router.get('/remove/:tunerId', async (_req: Request, res: Response, _next: NextFunction) => {
  console.log('--- /tuners/remove/:tunerId route called ---')   
  if(!_req.params.tunerId || typeof _req.params.tunerId !== 'string') {
    console.error('Invalid tunerId: ', _req.params)
    res.statusMessage = 'Invalid tunerId'
    res.status(400).send()
    return
  }
  try {
    const tuners = await removeTuner(_req.params.tunerId)
    res.send(tuners)
  } catch (err: unknown) {
    res.statusMessage = err instanceof Error ? err.message : 'Error'
    res.status(503).send()
  }
})

export default router