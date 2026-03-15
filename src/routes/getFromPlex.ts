import { Router } from 'express'
import type { Request, Response, NextFunction } from 'express'
import { getAllEpisodesForShow, getAllItemsInSection, getItemDetails, getPlexLibrary } from '../connectors/plex.js'

const router = Router()

/*****************************************************
 * Plex Library Routes
 *****************************************************/

// Route to fetch all Plex library sections categorized into movies, shows, music, and other
router.get('/getAllLibraries/', async (_req: Request, res: Response, _next: NextFunction) => {
  console.log('--- /getFromPlex/getAllLibraries route called ---')
  try {
    const library = await getPlexLibrary()
    res.send(library)
  } catch (err: unknown) {
    res.statusMessage = err instanceof Error ? err.message : 'Error'
    res.status(503).send()
  }
})

// Route to fetch all episodes for a specific show by providing the show's ratingKey as a URL parameter
router.get('/allEpisodes/:ratingKey', async (_req: Request, res: Response, _next: NextFunction) => {
  console.log('--- /getFromPlex/allEpisodes route called ---')
  if (!_req.params.ratingKey || typeof _req.params.ratingKey !== 'string') {
    console.log(_req.params)
    res.statusMessage = 'Invalid ratingKey'
    res.status(400).send()
    return
  }

  try {
    const library = await getAllEpisodesForShow(_req.params.ratingKey)
    res.send(library)
  } catch (err: unknown) {
    res.statusMessage = err instanceof Error ? err.message : 'Error'
    res.status(503).send()
  }
})

// Route to fetch all items in a specific Plex library section by providing the sectionKey as a URL parameter
router.get('/allLibraryItems/:sectionKey', async (_req: Request, res: Response, _next: NextFunction) => {
  console.log('--- /getFromPlex/allLibraryItems route called ---')
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

// Route to fetch detailed information for a specific Plex library item by providing the ratingKey as a URL parameter
router.get('/itemDetails/:ratingKey', async (_req: Request, res: Response, _next: NextFunction) => {
  console.log('--- /getFromPlex/itemDetails route called ---')
  if (!_req.params.ratingKey || typeof _req.params.ratingKey !== 'string') {
    console.log(_req.params)
    res.statusMessage = 'Invalid ratingKey'
    res.status(400).send()
    return
  }

  try {
    const library = await getItemDetails(_req.params.ratingKey)
    res.send(library)
  } catch (err: unknown) {
    res.statusMessage = err instanceof Error ? err.message : 'Error'
    res.status(503).send()
  }
})

export default router
