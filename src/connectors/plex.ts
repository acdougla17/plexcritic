import { config } from '../config.js'
import axios from 'axios'
import type {
  PlexLibrary,
  PlexLibraryResponse,
  PlexLibraryItemResponse,
} from '../types/plex.js'
import type { Movies } from '../types/database.js'
import { upsertMoviesBulk } from '../db/database.js'

export async function makePlexRequest<T>(endpoint: string): Promise<T> {
  const plexIp = config.plexUrl
  const plexPort = config.plexPort
  const plexToken = config.plexToken

  const url = `http://${plexIp}:${plexPort}${endpoint}?X-Plex-Token=${plexToken}`
  try {
    const response = await axios.get<T>(url)
    return response.data
  } catch (err: unknown) {
    console.error(`MPR1: Error making Plex request to ${endpoint}:`, err)
    throw err
  }
}

/**************************************************************************
 * Function to fetch Plex library sections and categorize them into movies, shows, music, and other
 * Returns a PlexLibrary object with categorized sections
 * Throws an error if the request fails or if the response format is unexpected
 **************************************************************************/
export async function getPlexLibrary(): Promise<PlexLibrary> {
  const endpoint = `/library/sections`
  const library: PlexLibrary = {
    movies: [],
    shows: [],
    music: [],
    other: [],
  }

  try {
    const response = await makePlexRequest<PlexLibraryResponse>(endpoint)
    for (const section of response.MediaContainer.Directory) {
      const agent = section.agent.toLowerCase()
      if (agent.includes('movie')) {
        library.movies.push(section)
      } else if (agent.includes('series')) {
        library.shows.push(section)
      } else if (agent.includes('music')) {
        library.music.push(section)
      } else {
        library.other.push(section)
      }
      console.log('Locatiopn data for section:', section)
    }
  } catch (err: unknown) {
    console.error('GPL1: Error fetching Plex library sections:', err)
    throw err
  }

  return library
}

export async function getAllItemsInSection(sectionKey: string): Promise<any> {
  const endpoint = `/library/sections/${sectionKey}/all`
  console.log(endpoint)
  try {
    const response: PlexLibraryItemResponse = await makePlexRequest(endpoint)
    console.log(
      response.MediaContainer.Metadata.length,
      'items found in ',
      response.MediaContainer.librarySectionTitle,
    )
    if (response.MediaContainer.viewGroup === 'movie') {
      const movies: Movies[] = response.MediaContainer.Metadata.map((item) => ({
        ratingKey: item.ratingKey,
        title: item.title,
        year: item.year,
        dateAdded: item.addedAt,
        originallyAvailableAt: item.originallyAvailableAt,
        addedAt: item.addedAt,
        //lastViewedAt: 0, // item.lastViewedAt,
        //playCount: 0, // item.playCount,
        //genres: item.Genre ? item.Genre.map((g: any) => g.tag).join(', ') : '',
        
        audioCodec: item.Media[0].audioCodec,
        videoCodec: item.Media[0].videoCodec,
        videoResolution: item.Media[0].videoResolution,
        container: item.Media[0].container,
        duration: item.Media[0].duration,
        collections: item.Collection ? item.Collection.map((c) => c.tag).join(', ') : '',
        coverPosterUrl: item.thumb ?? '',
      }))

      upsertMoviesBulk(movies)
    }
    return response
  } catch (err: unknown) {
    console.error(`Error fetching items in section ${sectionKey}:`, err)
    throw err
  }
}
