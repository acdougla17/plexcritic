import { Router } from 'express'
import type { Request, Response, NextFunction } from 'express'
import { getAllItemsInSection, getPlexLibrary } from '../connectors/plex.js'
import { refreshAllItemsInSection } from '../db/database.js'
import type { CriticDatabaseLibrary } from '../types/database.js'

const router = Router()

router.get('/:sectionKey', async (_req: Request, res: Response, _next: NextFunction) => {
  console.log('--- refreshLibrary route called ---')
  if (!_req.params.sectionKey || typeof _req.params.sectionKey !== 'string') {
    console.log(_req.params)
    res.statusMessage = 'Invalid sectionKey'
    res.status(400).send()
    return
  }
  
  let librariesToRefresh = _req.params.sectionKey.split(',').map((s) => s.trim())
  let library: CriticDatabaseLibrary = { movies: [], shows: [], music: [], other: [] }
  try {
    // fetch all libraries to have a list to compare against the provided section keys
    const allLibraries = await getPlexLibrary()
   
    // if the first item is ALL, then we want to refresh all libraries
    if (librariesToRefresh[0]?.toUpperCase() === 'ALL'){
        librariesToRefresh = allLibraries.movies.map((s) => s.key)
          .concat(allLibraries.shows.map((s) => s.key))
          .concat(allLibraries.music.map((s) => s.key))
          .concat(allLibraries.other.map((s) => s.key))
    }
    console.log('Refreshing: ', librariesToRefresh)
    // loop through the provided section keys, fetch all items in each section, and append to the library object
    for (const sectionKey of librariesToRefresh) {
        // check if the section key exists in any of the libraries before making the request to fetch items
        const sectionExists = allLibraries.movies.some((s) => s.key === sectionKey) ||
          allLibraries.shows.some((s) => s.key === sectionKey) ||
          allLibraries.music.some((s) => s.key === sectionKey) ||
          allLibraries.other.some((s) => s.key === sectionKey)
        if (!sectionExists) {
          console.warn(`Section key ${sectionKey} not found in any library. Skipping.`)
          continue
        }
        const sectionLibrary = await getAllItemsInSection(sectionKey)
        refreshAllItemsInSection(sectionLibrary)
    }
    res.send({ message: 'Library refresh initiated' })
  } catch (err: unknown) {
    res.statusMessage = err instanceof Error ? err.message : 'Error'
    res.status(503).send()
  }
})

export default router
