import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  makeMovieItem,
  makeMovieLibraryResponse,
  makeShowLibraryResponse,
  makeEpisodeItem,
  makeEpisodeLibraryResponse,
} from '../../test/fixtures.js'

// mapPlexShows calls getAllEpisodesForShow() internally to fetch episodes
// for each show, so we mock the connector rather than hit a real Plex server.
vi.mock('../../connectors/plex.js', () => ({
  getAllEpisodesForShow: vi.fn(),
}))

import { mapPlexMovies, mapPlexShows, mapPlexEpisodes } from '../database.js'
import { getAllEpisodesForShow } from '../../connectors/plex.js'

describe('mapPlexMovies', () => {
  it('maps a single movie into media, movies, and media_files records', () => {
    const response = makeMovieLibraryResponse([makeMovieItem()])
    const result = mapPlexMovies(response)

    expect(result.mediaArr).toHaveLength(1)
    expect(result.mediaArr[0]).toMatchObject({
      ratingKey: '1',
      title: 'Test Movie',
      year: 2020,
      libraryName: 'Movies',
      librarySectionKey: '1',
    })

    expect(result.moviesArr).toHaveLength(1)
    expect(result.moviesArr[0]).toMatchObject({
      ratingKey: '1',
      studio: 'Test Studio',
      tagLine: 'It is a test.',
    })

    expect(result.mediaFilesArr).toHaveLength(1)
    expect(result.mediaFilesArr[0]).toMatchObject({
      ratingKey: '1',
      videoCodec: 'h264',
      container: 'mp4',
      file: '/movies/Test Movie (2020)/Test Movie.mp4',
    })
  })

  it('handles multiple files (Media entries) for a single movie', () => {
    const movie = makeMovieItem({
      Media: [
        ...makeMovieItem().Media,
        {
          id: 102,
          duration: 7200000,
          bitrate: 20000,
          width: 3840,
          height: 2160,
          aspectRatio: 1.78,
          audioChannels: 8,
          audioCodec: 'truehd',
          videoCodec: 'hevc',
          videoResolution: '4k',
          container: 'mkv',
          videoFrameRate: '24p',
          audioProfile: '',
          videoProfile: 'main10',
          hasVoiceActivity: false,
          Part: [
            {
              id: 202,
              key: '/library/parts/202',
              duration: 7200000,
              file: '/movies/Test Movie (2020)/Test Movie 4K.mkv',
              size: 30000000000,
              audioProfile: '',
              container: 'mkv',
              videoProfile: 'main10',
            },
          ],
        },
      ] as any,
    })
    const result = mapPlexMovies(makeMovieLibraryResponse([movie]))
    expect(result.mediaFilesArr).toHaveLength(2)
    expect(result.mediaFilesArr.map((f) => f.container)).toEqual(['mp4', 'mkv'])
  })

  it('deduplicates tags but keeps one media_tags link per occurrence', () => {
    const movieA = makeMovieItem({ ratingKey: '1', Genre: [{ tag: 'Drama' }] })
    const movieB = makeMovieItem({ ratingKey: '2', Genre: [{ tag: 'Drama' }] })
    const result = mapPlexMovies(makeMovieLibraryResponse([movieA, movieB]))

    const dramaTags = result.tagsArr.filter(
      (t) => t.tagType === 'genre' && t.name === 'Drama',
    )
    expect(dramaTags).toHaveLength(1) // deduped

    const dramaLinks = result.mediaTagLinks.filter(
      (l) => l.tagType === 'genre' && l.tagName === 'Drama',
    )
    expect(dramaLinks).toHaveLength(2) // one per movie
    expect(dramaLinks.map((l) => l.ratingKey).sort()).toEqual(['1', '2'])
  })

  it('defaults missing optional fields instead of leaving them undefined', () => {
    const movie = makeMovieItem({ studio: undefined, tagline: undefined } as any)
    const result = mapPlexMovies(makeMovieLibraryResponse([movie]))
    expect(result.moviesArr[0]?.studio).toBe('')
    expect(result.moviesArr[0]?.tagLine).toBe('')
  })
})

describe('mapPlexEpisodes (the correct, direct-episode mapper)', () => {
  it('keys the media record to the episode ratingKey, not the show', () => {
    const response = makeEpisodeLibraryResponse([makeEpisodeItem()])
    const result = mapPlexEpisodes(response)
    expect(result.mediaArr[0]?.ratingKey).toBe('10') // episode's own ratingKey
  })

  it('maps parentIndex -> seasonNumber and index -> episodeNumber', () => {
    const episode = makeEpisodeItem({ parentIndex: 2, index: 3 })
    const result = mapPlexEpisodes(makeEpisodeLibraryResponse([episode]))
    expect(result.episodesArr[0]).toMatchObject({
      seasonNumber: 2,
      episodeNumber: 3,
      showRatingKey: '5', // from grandparentRatingKey
    })
  })
})
