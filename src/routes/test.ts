import { Router } from 'express'
import type { Request, Response, NextFunction } from 'express'
//import * as Plex from '../connectors/plex.js'
//import * as DB from '../db/database.js'
import type { PlexLibraryItemResponse } from '../types/plex.js'
import { makePlexRequest } from '../connectors/plex.js'

const router = Router()

/*****************************************************
 * Plex Library Routes
 *****************************************************/

// Route to fetch all Plex library sections categorized into movies, shows, music, and other
router.get(
  '/',
  async (_req: Request, res: Response, _next: NextFunction) => {
    console.log('--- /test route called ---')

    const endpoint = `/library/sections/4/all?artist.id=115484`
    const response: PlexLibraryItemResponse = await makePlexRequest(endpoint)
    console.log('Plex response: ', response)
    res.send(response)
    // try {
    //   const test = _req.params.test?.toString()
    //   if (test === 'movie') {
    //     //const movies = await Plex.getItemDetails('72729')
    //     const movies = await Plex.getAllItemsInSection('2') // Home movies
    //     console.log(' fetched ', movies.MediaContainer.Metadata[0].title)
    //     const mappedMovies = await DB.mapPlexMovies(movies)
    //     const result = await DB.upsertMovie(mappedMovies)
    //     res.send(result)
    //   } else if (test === 'show') {
    //     const shows = await Plex.getItemDetails('56412')
    //     console.log(' fetched ', shows.MediaContainer.Metadata[0].title)
    //     const mappedShows = await DB.mapPlexShows(shows)
    //     const result = await DB.upsertShow(mappedShows)
    //     res.send(result)
    //   } else {
    //     res.send('No test ran')
    //   }
    // } catch (err: unknown) {
    //   res.statusMessage = err instanceof Error ? err.message : 'Error'
    //   console.log(res.statusMessage)
    //   res.status(503).send()
    // }
  },
)

export default router
