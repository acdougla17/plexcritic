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

/**
 * Builds a minimal fake Plex "artist" item (as returned from /library/sections/{id}/all).
 */
export function makeArtistItem(
  overrides: Partial<PlexLibraryItem> = {},
): PlexLibraryItem {
  return {
    addedAt: 1700000000,
    art: '/art.jpg',
    chapterSource: '',
    contentRating: '',
    duration: 0,
    key: '/library/metadata/100',
    originallyAvailableAt: '',
    lastViewedAt: 0,
    primaryExtraKey: '',
    rating: 0,
    ratingKey: '100',
    studio: '',
    summary: 'A test artist.',
    tagline: '',
    thumb: '/thumb.jpg',
    title: 'Test Artist',
    type: 'artist',
    updatedAt: 1700000000,
    year: 0,
    contentRatingAge: 0,
    audienceRating: 0,
    Media: [] as unknown as PlexLibraryItem['Media'],
    Genre: [{ tag: 'Rock' }],
    ...overrides,
  } as PlexLibraryItem
}

/**
 * Builds a minimal fake Plex "album" item.
 */
export function makeAlbumItem(
  overrides: Partial<PlexLibraryItem> = {},
): PlexLibraryItem {
  return {
    addedAt: 1700000000,
    art: '/art.jpg',
    chapterSource: '',
    contentRating: '',
    duration: 0,
    key: '/library/metadata/101',
    parentRatingKey: '100', // the artist's ratingKey
    originallyAvailableAt: '2020-01-01',
    lastViewedAt: 0,
    primaryExtraKey: '',
    rating: 0,
    ratingKey: '101',
    studio: '',
    summary: 'A test album.',
    tagline: '',
    thumb: '/thumb.jpg',
    title: 'Test Album',
    type: 'album',
    updatedAt: 1700000000,
    year: 2020,
    contentRatingAge: 0,
    audienceRating: 0,
    Media: [] as unknown as PlexLibraryItem['Media'],
    ...overrides,
  } as PlexLibraryItem
}

/**
 * Builds a minimal fake Plex "track" item.
 */
export function makeTrackItem(
  overrides: Partial<PlexLibraryItem> = {},
): PlexLibraryItem {
  return {
    addedAt: 1700000000,
    art: '/art.jpg',
    chapterSource: '',
    contentRating: '',
    duration: 240000,
    key: '/library/metadata/102',
    parentRatingKey: '101', // the album's ratingKey
    grandparentRatingKey: '100', // the artist's ratingKey
    originallyAvailableAt: '',
    index: 1, // track number
    lastViewedAt: 0,
    primaryExtraKey: '',
    rating: 0,
    ratingKey: '102',
    studio: '',
    summary: '',
    tagline: '',
    thumb: '/thumb.jpg',
    title: 'Test Song',
    type: 'track',
    updatedAt: 1700000000,
    year: 2020,
    contentRatingAge: 0,
    audienceRating: 0,
    Media: [
      {
        id: 501,
        duration: 240000,
        bitrate: 320,
        width: 0,
        height: 0,
        aspectRatio: 0,
        audioChannels: 2,
        audioCodec: 'mp3',
        videoCodec: '',
        videoResolution: '',
        container: 'mp3',
        videoFrameRate: '',
        audioProfile: '',
        videoProfile: '',
        hasVoiceActivity: false,
        Part: [
          {
            id: 601,
            key: '/library/parts/601',
            duration: 240000,
            file: '/music/Test Artist/Test Album/01 - Test Song.mp3',
            size: 10000000,
            audioProfile: '',
            container: 'mp3',
            videoProfile: '',
          },
        ],
      },
    ],
    ...overrides,
  } as PlexLibraryItem
}

export function makeArtistLibraryResponse(
  items: PlexLibraryItem[] = [makeArtistItem()],
): PlexLibraryItemResponse {
  return {
    MediaContainer: {
      allowSync: true,
      art: '/art.jpg',
      identifier: 'com.plexapp.plugins.library',
      librarySectionID: 3,
      librarySectionTitle: 'Music',
      librarySectionUUID: 'uuid-3',
      mediaTagPrefix: '/system/bundle/media/flags/',
      mediaTagVersion: 1,
      size: items.length,
      thumb: '/thumb.jpg',
      title1: 'Music',
      title2: 'All Artists',
      viewGroup: 'artist',
      viewMode: '65592',
      Metadata: items as [PlexLibraryItem],
    },
  }
}

export function makeAlbumLibraryResponse(
  items: PlexLibraryItem[] = [makeAlbumItem()],
): PlexLibraryItemResponse {
  return {
    MediaContainer: {
      allowSync: true,
      art: '/art.jpg',
      identifier: 'com.plexapp.plugins.library',
      librarySectionID: 3,
      librarySectionTitle: 'Music',
      librarySectionUUID: 'uuid-3',
      mediaTagPrefix: '/system/bundle/media/flags/',
      mediaTagVersion: 1,
      size: items.length,
      thumb: '/thumb.jpg',
      title1: 'Music',
      title2: 'Test Artist',
      viewGroup: 'album',
      viewMode: '65592',
      Metadata: items as [PlexLibraryItem],
    },
  }
}

export function makeTrackLibraryResponse(
  items: PlexLibraryItem[] = [makeTrackItem()],
): PlexLibraryItemResponse {
  return {
    MediaContainer: {
      allowSync: true,
      art: '/art.jpg',
      identifier: 'com.plexapp.plugins.library',
      librarySectionID: 3,
      librarySectionTitle: 'Music',
      librarySectionUUID: 'uuid-3',
      mediaTagPrefix: '/system/bundle/media/flags/',
      mediaTagVersion: 1,
      size: items.length,
      thumb: '/thumb.jpg',
      title1: 'Music',
      title2: 'Test Album',
      viewGroup: 'track',
      viewMode: '65592',
      Metadata: items as [PlexLibraryItem],
    },
  }
}
