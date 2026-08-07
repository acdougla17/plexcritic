import type { PlexLibraryItemResponse, PlexLibraryItem } from '../types/plex.js'

/**
 * Builds a minimal-but-valid fake Plex "movie" item. Override any field
 * via the `overrides` param, e.g. makeMovie({ ratingKey: '2' }).
 */
export function makeMovieItem(
  overrides: Partial<PlexLibraryItem> = {},
): PlexLibraryItem {
  return {
    addedAt: 1700000000,
    art: '/art.jpg',
    chapterSource: '',
    contentRating: 'PG-13',
    duration: 7200000,
    key: '/library/metadata/1',
    originallyAvailableAt: '2020-01-01',
    lastViewedAt: 0,
    primaryExtraKey: '',
    rating: 8.5,
    ratingKey: '1',
    studio: 'Test Studio',
    summary: 'A test movie.',
    tagline: 'It is a test.',
    thumb: '/thumb.jpg',
    title: 'Test Movie',
    type: 'movie',
    updatedAt: 1700000000,
    year: 2020,
    contentRatingAge: 13,
    audienceRating: 7.8,
    Media: [
      {
        id: 101,
        duration: 7200000,
        bitrate: 8000,
        width: 1920,
        height: 1080,
        aspectRatio: 1.78,
        audioChannels: 6,
        audioCodec: 'aac',
        videoCodec: 'h264',
        videoResolution: '1080',
        container: 'mp4',
        videoFrameRate: '24p',
        audioProfile: 'lc',
        videoProfile: 'high',
        hasVoiceActivity: false,
        Part: [
          {
            id: 201,
            key: '/library/parts/201',
            duration: 7200000,
            file: '/movies/Test Movie (2020)/Test Movie.mp4',
            size: 4000000000,
            audioProfile: 'lc',
            container: 'mp4',
            videoProfile: 'high',
          },
        ],
      },
    ],
    Genre: [{ tag: 'Drama' }, { tag: 'Thriller' }],
    Director: [{ tag: 'Jane Director' }],
    Writer: [{ tag: 'John Writer' }],
    ...overrides,
  } as PlexLibraryItem
}

export function makeMovieLibraryResponse(
  items: PlexLibraryItem[] = [makeMovieItem()],
): PlexLibraryItemResponse {
  return {
    MediaContainer: {
      allowSync: true,
      art: '/art.jpg',
      identifier: 'com.plexapp.plugins.library',
      librarySectionID: 1,
      librarySectionTitle: 'Movies',
      librarySectionUUID: 'uuid-1',
      mediaTagPrefix: '/system/bundle/media/flags/',
      mediaTagVersion: 1,
      size: items.length,
      thumb: '/thumb.jpg',
      title1: 'Movies',
      title2: 'All Movies',
      viewGroup: 'movie',
      viewMode: '65592',
      Metadata: items as [PlexLibraryItem],
    },
  }
}

/**
 * Builds a minimal fake Plex "episode" item (as returned nested under a show,
 * e.g. from /library/metadata/{ratingKey}/allLeaves).
 */
export function makeEpisodeItem(
  overrides: Partial<PlexLibraryItem> = {},
): PlexLibraryItem {
  return {
    addedAt: 1700000000,
    art: '/art.jpg',
    chapterSource: '',
    contentRating: 'TV-14',
    duration: 1500000,
    key: '/library/metadata/10',
    grandparentRatingKey: '5', // the show's ratingKey
    originallyAvailableAt: '2021-05-01',
    index: 3, // episode number within season
    parentIndex: 2, // season number
    lastViewedAt: 0,
    primaryExtraKey: '',
    rating: 8.0,
    ratingKey: '10',
    studio: 'Test Network',
    summary: 'A test episode.',
    tagline: '',
    thumb: '/thumb.jpg',
    title: 'Test Episode',
    type: 'episode',
    updatedAt: 1700000000,
    year: 2021,
    contentRatingAge: 14,
    audienceRating: 8.2,
    Media: [
      {
        id: 301,
        duration: 1500000,
        bitrate: 4000,
        width: 1920,
        height: 1080,
        aspectRatio: 1.78,
        audioChannels: 2,
        audioCodec: 'ac3',
        videoCodec: 'hevc',
        videoResolution: '1080',
        container: 'mkv',
        videoFrameRate: '24p',
        audioProfile: '',
        videoProfile: 'main10',
        hasVoiceActivity: false,
        Part: [
          {
            id: 401,
            key: '/library/parts/401',
            duration: 1500000,
            file: '/tv/Test Show/Season 02/S02E03.mkv',
            size: 1500000000,
            audioProfile: '',
            container: 'mkv',
            videoProfile: 'main10',
          },
        ],
      },
    ],
    ...overrides,
  } as PlexLibraryItem
}

export function makeShowItem(overrides: Partial<PlexLibraryItem> = {}): PlexLibraryItem {
  return {
    addedAt: 1699000000,
    art: '/art.jpg',
    chapterSource: '',
    contentRating: 'TV-14',
    duration: 0,
    key: '/library/metadata/5',
    originallyAvailableAt: '2019-01-01',
    lastViewedAt: 0,
    primaryExtraKey: '',
    rating: 8.7,
    ratingKey: '5',
    studio: 'Test Network',
    summary: 'A test show.',
    tagline: '',
    thumb: '/thumb.jpg',
    title: 'Test Show',
    type: 'show',
    updatedAt: 1699000000,
    year: 2019,
    contentRatingAge: 14,
    audienceRating: 8.5,
    Media: [] as unknown as PlexLibraryItem['Media'],
    Genre: [{ tag: 'Sci-Fi' }],
    ...overrides,
  } as PlexLibraryItem
}

export function makeShowLibraryResponse(
  items: PlexLibraryItem[] = [makeShowItem()],
): PlexLibraryItemResponse {
  return {
    MediaContainer: {
      allowSync: true,
      art: '/art.jpg',
      identifier: 'com.plexapp.plugins.library',
      librarySectionID: 2,
      librarySectionTitle: 'TV Shows',
      librarySectionUUID: 'uuid-2',
      mediaTagPrefix: '/system/bundle/media/flags/',
      mediaTagVersion: 1,
      size: items.length,
      thumb: '/thumb.jpg',
      title1: 'TV Shows',
      title2: 'All Shows',
      viewGroup: 'show',
      viewMode: '65592',
      Metadata: items as [PlexLibraryItem],
    },
  }
}

export function makeEpisodeLibraryResponse(
  items: PlexLibraryItem[] = [makeEpisodeItem()],
): PlexLibraryItemResponse {
  return {
    MediaContainer: {
      allowSync: true,
      art: '/art.jpg',
      identifier: 'com.plexapp.plugins.library',
      librarySectionID: 2,
      librarySectionTitle: 'TV Shows',
      librarySectionUUID: 'uuid-2',
      mediaTagPrefix: '/system/bundle/media/flags/',
      mediaTagVersion: 1,
      size: items.length,
      thumb: '/thumb.jpg',
      title1: 'TV Shows',
      title2: 'Test Show',
      viewGroup: 'episode',
      viewMode: '65592',
      Metadata: items as [PlexLibraryItem],
    },
  }
}
