import { config } from '../config.js'
import axios from 'axios'
import type {
  PlexLibrary,
  PlexLibraryResponse,
  PlexLibraryItemResponse,
  TunersResponse
} from '../types/plex.js'

export async function makePlexRequest<T>(endpoint: string, requestType = 'GET', additionalParams?: Record<string, string>): Promise<T> {
  const plexIp = config.plexUrl
  const plexPort = config.plexPort
  const plexToken = config.plexToken

  const url = `http://${plexIp}:${plexPort}${endpoint}`
  try {
    if(requestType === 'POST') {
      const response = await axios.post<T>(url, null, {
        params: { 'X-Plex-Token': plexToken, ...additionalParams },
        headers: { Accept: 'application/json' }
      })
      return response.data
    } else if(requestType === 'DELETE') {
      const response = await axios.delete<T>(url, {
        params: { 'X-Plex-Token': plexToken, ...additionalParams },
        headers: { Accept: 'application/json' }
      })
      return response.data
    } else {
      const response = await axios.get<T>(url, {
        params: { 'X-Plex-Token': plexToken, ...additionalParams },
        headers: { Accept: 'application/json' }
      })
      return response.data
    }
  } catch (err: unknown) {
    console.error(`MPR1: Error making Plex request to ${endpoint}:`)
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
    }
  } catch (err: unknown) {
    console.error('GPL1: Error fetching Plex library sections:', err)
    throw err
  }

  return library
}

export async function getAllItemsInSection(
  sectionKey: string,
): Promise<PlexLibraryItemResponse> {
  const endpoint = `/library/sections/${sectionKey}/all`
  try {
    const response: PlexLibraryItemResponse = await makePlexRequest(endpoint)
    console.log(
      response.MediaContainer.Metadata.length,
      'items found in ',
      response.MediaContainer.librarySectionTitle,
    )
    return response
  } catch (err: unknown) {
    console.error(`Error fetching items in section ${sectionKey}:`, err)
    throw err
  }
}

export async function getItemDetails(
  ratingKey: string,
): Promise<PlexLibraryItemResponse> {
  const endpoint = `/library/metadata/${ratingKey}`
  try {
    const response: PlexLibraryItemResponse = await makePlexRequest(endpoint)
    return response
  } catch (err: unknown) {
    console.error(
      `Error fetching details for item with ratingKey ${ratingKey}:`,
      err,
    )
    throw err
  }
}

export async function getAllEpisodesForShow(
  ratingKey: string,
): Promise<PlexLibraryItemResponse> {
  const endpoint = `/library/metadata/${ratingKey}/allLeaves`
  try {
    const response: PlexLibraryItemResponse = await makePlexRequest(endpoint)
    return response
  } catch (err: unknown) {
    console.error(
      `Error fetching all episodes for show with ratingKey ${ratingKey}:`,
      err,
    )
    throw err
  }
}

export async function getChildrenForArtist(
  librarySectionId: string,
  artistRatingKey: string,
): Promise<PlexLibraryItemResponse> {
  const endpoint = `/library/sections/${librarySectionId}/all?artist.id=${encodeURIComponent(
    artistRatingKey,
  )}&type=9`
  try {
    const response: PlexLibraryItemResponse = await makePlexRequest(endpoint)
    return response
  } catch (err: unknown) {
    console.error(
      `Error fetching albums for artist ${artistRatingKey} in section ${librarySectionId}:`,
      err,
    )
    throw err
  }
}

export async function getChildrenForAlbum(
  albumRatingKey: string,
): Promise<PlexLibraryItemResponse> {
  const endpoint = `/library/metadata/${albumRatingKey}/children`
  try {
    const response: PlexLibraryItemResponse = await makePlexRequest(endpoint)
    return response
  } catch (err: unknown) {
    console.error(
      `Error fetching tracks for album with ratingKey ${albumRatingKey}:`,
      err,
    )
    throw err
  }
}

export async function getAllTuners(): Promise<any> {
  /* Sample CURL
  curl -s "http://192.168.1.100:32469/media/grabbers/devices?X-Plex-Token=YOUR_PLEX_TOKEN" \ | xmllint --format - 2</dev/null | grep -E 'MediaContainer size=|key=|uri='
  */
 console.log('Fetching all tuners from Plex...')
 const endpoint = `/media/grabbers/devices`
  try {
    const response = await makePlexRequest<TunersResponse>(endpoint)
    return response
  } catch (err: unknown) {
    console.error(`Error fetching all tuners:`, err)
    throw err
  }
}

export async function removeTuner(tunerId: string): Promise<any> {
console.log(`Removing tuner with ID: ${tunerId} from Plex...`)
  const endpoint = `/media/grabbers/devices/${tunerId}`
  try {
    const response = await makePlexRequest<TunersResponse>(endpoint,'DELETE',{ 'X-Plex-Token': config.plexToken})
    return response
  } catch (err: unknown) {
    console.error(`Error removing tuner with ID ${tunerId}:`, err)
    throw err
  }
}