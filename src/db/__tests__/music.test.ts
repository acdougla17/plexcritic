import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  makeArtistItem,
  makeArtistLibraryResponse,
  makeAlbumItem,
  makeAlbumLibraryResponse,
  makeTrackItem,
  makeTrackLibraryResponse,
} from '../../test/fixtures.js'

// mapPlexMusic calls getChildrenForArtist() and getChildrenForAlbum() internally
vi.mock('../../connectors/plex.js', () => ({
  getChildrenForArtist: vi.fn(),
  getChildrenForAlbum: vi.fn(),
}))

import { mapPlexMusic } from '../database.js'
import { getChildrenForArtist, getChildrenForAlbum } from '../../connectors/plex.js'

describe('mapPlexMusic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('maps a single artist, album, and track into correct data structures', async () => {
    const mockGetChildrenForArtist = getChildrenForArtist as any
    const mockGetChildrenForAlbum = getChildrenForAlbum as any

    mockGetChildrenForArtist.mockResolvedValue(makeAlbumLibraryResponse([makeAlbumItem()]))
    mockGetChildrenForAlbum.mockResolvedValue(makeTrackLibraryResponse([makeTrackItem()]))

    const response = makeArtistLibraryResponse([makeArtistItem()])
    const result = await mapPlexMusic(response)

    expect(result.musicArtistsArr).toHaveLength(1)
    expect(result.musicArtistsArr[0]).toMatchObject({
      id: 100,
      name: 'Test Artist',
    })

    expect(result.musicAlbumsArr).toHaveLength(1)
    expect(result.musicAlbumsArr[0]).toMatchObject({
      id: 101,
      artistId: 100,
      title: 'Test Album',
      year: 2020,
    })

    expect(result.musicTracksArr).toHaveLength(1)
    expect(result.musicTracksArr[0]).toMatchObject({
      ratingKey: '102',
      artistId: 100,
      albumId: 101,
      trackNumber: 1,
    })

    // Verify media record created for track
    expect(result.mediaArr).toHaveLength(1)
    expect(result.mediaArr[0]).toMatchObject({
      ratingKey: '102',
      type: 'track',
      title: 'Test Song',
      year: 2020,
      libraryName: 'Music',
      librarySectionKey: '3',
    })

    // Verify media files created
    expect(result.mediaFilesArr).toHaveLength(1)
    expect(result.mediaFilesArr[0]).toMatchObject({
      ratingKey: '102',
      audioCodec: 'mp3',
      container: 'mp3',
      file: '/music/Test Artist/Test Album/01 - Test Song.mp3',
    })
  })

  it('handles multiple tracks in a single album', async () => {
    const mockGetChildrenForArtist = getChildrenForArtist as any
    const mockGetChildrenForAlbum = getChildrenForAlbum as any

    const track2 = makeTrackItem({
      ratingKey: '103',
      title: 'Test Song 2',
      index: 2,
    })

    mockGetChildrenForArtist.mockResolvedValue(
      makeAlbumLibraryResponse([makeAlbumItem()]),
    )
    mockGetChildrenForAlbum.mockResolvedValue(
      makeTrackLibraryResponse([makeTrackItem(), track2]),
    )

    const response = makeArtistLibraryResponse([makeArtistItem()])
    const result = await mapPlexMusic(response)

    expect(result.musicTracksArr).toHaveLength(2)
    expect(result.musicTracksArr[1]).toMatchObject({
      ratingKey: '103',
      trackNumber: 2,
    })
    expect(result.mediaArr).toHaveLength(2)
  })

  it('handles multiple albums from a single artist', async () => {
    const mockGetChildrenForArtist = getChildrenForArtist as any
    const mockGetChildrenForAlbum = getChildrenForAlbum as any

    const album2 = makeAlbumItem({
      ratingKey: '104',
      title: 'Another Album',
      year: 2021,
    })

    mockGetChildrenForArtist.mockResolvedValue(
      makeAlbumLibraryResponse([makeAlbumItem(), album2]),
    )
    mockGetChildrenForAlbum.mockResolvedValueOnce(
      makeTrackLibraryResponse([makeTrackItem()]),
    )
    mockGetChildrenForAlbum.mockResolvedValueOnce(
      makeTrackLibraryResponse([
        makeTrackItem({
          ratingKey: '105',
          title: 'Another Song',
          parentRatingKey: '104',
        }),
      ]),
    )

    const response = makeArtistLibraryResponse([makeArtistItem()])
    const result = await mapPlexMusic(response)

    expect(result.musicAlbumsArr).toHaveLength(2)
    expect(result.musicAlbumsArr.map((a) => a.title).sort()).toEqual([
      'Another Album',
      'Test Album',
    ])
    expect(result.musicTracksArr).toHaveLength(2)
  })

  it('handles multiple artists in a single library', async () => {
    const mockGetChildrenForArtist = getChildrenForArtist as any
    const mockGetChildrenForAlbum = getChildrenForAlbum as any

    const artist2 = makeArtistItem({
      ratingKey: '110',
      title: 'Another Artist',
    })

    mockGetChildrenForArtist.mockResolvedValueOnce(
      makeAlbumLibraryResponse([makeAlbumItem()]),
    )
    mockGetChildrenForArtist.mockResolvedValueOnce(
      makeAlbumLibraryResponse([
        makeAlbumItem({
          ratingKey: '111',
          parentRatingKey: '110',
          title: 'Artist 2 Album',
        }),
      ]),
    )
    mockGetChildrenForAlbum.mockResolvedValueOnce(
      makeTrackLibraryResponse([makeTrackItem()]),
    )
    mockGetChildrenForAlbum.mockResolvedValueOnce(
      makeTrackLibraryResponse([
        makeTrackItem({
          ratingKey: '112',
          parentRatingKey: '111',
          grandparentRatingKey: '110',
          title: 'Artist 2 Song',
        }),
      ]),
    )

    const response = makeArtistLibraryResponse([makeArtistItem(), artist2])
    const result = await mapPlexMusic(response)

    expect(result.musicArtistsArr).toHaveLength(2)
    expect(result.musicArtistsArr.map((a) => a.name).sort()).toEqual([
      'Another Artist',
      'Test Artist',
    ])
    expect(result.musicAlbumsArr).toHaveLength(2)
    expect(result.musicTracksArr).toHaveLength(2)
  })

  it('prevents duplicate artists with different ratingKeys from being skipped', async () => {
    const mockGetChildrenForArtist = getChildrenForArtist as any
    const mockGetChildrenForAlbum = getChildrenForAlbum as any

    // Two different artists with the same name but different ratingKeys
    const artist1 = makeArtistItem({
      ratingKey: '100',
      title: 'Same Name Artist',
    })
    const artist2 = makeArtistItem({
      ratingKey: '110',
      title: 'Same Name Artist', // Same name!
    })

    mockGetChildrenForArtist.mockResolvedValueOnce(
      makeAlbumLibraryResponse([
        makeAlbumItem({
          ratingKey: '101',
          parentRatingKey: '100',
        }),
      ]),
    )
    mockGetChildrenForArtist.mockResolvedValueOnce(
      makeAlbumLibraryResponse([
        makeAlbumItem({
          ratingKey: '111',
          parentRatingKey: '110',
        }),
      ]),
    )
    mockGetChildrenForAlbum.mockResolvedValueOnce(
      makeTrackLibraryResponse([makeTrackItem()]),
    )
    mockGetChildrenForAlbum.mockResolvedValueOnce(
      makeTrackLibraryResponse([
        makeTrackItem({
          ratingKey: '112',
          parentRatingKey: '111',
          grandparentRatingKey: '110',
        }),
      ]),
    )

    const response = makeArtistLibraryResponse([artist1, artist2])
    const result = await mapPlexMusic(response)

    // Both artists should be included despite same name
    expect(result.musicArtistsArr).toHaveLength(2)
    expect(result.musicArtistsArr.map((a) => a.id).sort()).toEqual([100, 110])

    // Both albums should be included with correct artistId references
    expect(result.musicAlbumsArr).toHaveLength(2)
    expect(result.musicAlbumsArr.some((a) => a.artistId === 100)).toBe(true)
    expect(result.musicAlbumsArr.some((a) => a.artistId === 110)).toBe(true)

    // Both tracks should be included with correct references
    expect(result.musicTracksArr).toHaveLength(2)
    expect(
      result.musicTracksArr.some((t) => t.artistId === 100),
    ).toBe(true)
    expect(
      result.musicTracksArr.some((t) => t.artistId === 110),
    ).toBe(true)
  })

  it('defaults missing optional fields to empty strings or zero', async () => {
    const mockGetChildrenForArtist = getChildrenForArtist as any
    const mockGetChildrenForAlbum = getChildrenForAlbum as any

    const artist = makeArtistItem({ title: undefined } as any)
    const album = makeAlbumItem({ title: undefined, year: undefined } as any)
    const track = makeTrackItem({ title: undefined, index: undefined } as any)

    mockGetChildrenForArtist.mockResolvedValue(makeAlbumLibraryResponse([album]))
    mockGetChildrenForAlbum.mockResolvedValue(makeTrackLibraryResponse([track]))

    const response = makeArtistLibraryResponse([artist])
    const result = await mapPlexMusic(response)

    expect(result.musicArtistsArr[0]?.name).toBe('Unknown Artist')
    expect(result.musicAlbumsArr[0]?.title).toBe('Unknown Album')
    expect(result.musicTracksArr[0]?.trackNumber).toBe(0)
  })

  it('handles tracks with multiple media files', async () => {
    const mockGetChildrenForArtist = getChildrenForArtist as any
    const mockGetChildrenForAlbum = getChildrenForAlbum as any

    const track = makeTrackItem({
      Media: [
        ...makeTrackItem().Media,
        {
          id: 502,
          duration: 240000,
          bitrate: 128,
          width: 0,
          height: 0,
          aspectRatio: 0,
          audioChannels: 2,
          audioCodec: 'aac',
          videoCodec: '',
          videoResolution: '',
          container: 'aac',
          videoFrameRate: '',
          audioProfile: '',
          videoProfile: '',
          hasVoiceActivity: false,
          Part: [
            {
              id: 602,
              key: '/library/parts/602',
              duration: 240000,
              file: '/music/Test Artist/Test Album/01 - Test Song.aac',
              size: 5000000,
              audioProfile: '',
              container: 'aac',
              videoProfile: '',
            },
          ],
        },
      ] as any,
    })

    mockGetChildrenForArtist.mockResolvedValue(makeAlbumLibraryResponse([makeAlbumItem()]))
    mockGetChildrenForAlbum.mockResolvedValue(makeTrackLibraryResponse([track]))

    const response = makeArtistLibraryResponse([makeArtistItem()])
    const result = await mapPlexMusic(response)

    expect(result.mediaFilesArr).toHaveLength(2)
    expect(result.mediaFilesArr.map((f) => f.container)).toEqual(['mp3', 'aac'])
  })

  it('handles Plex API returning single album object instead of array', async () => {
    const mockGetChildrenForArtist = getChildrenForArtist as any
    const mockGetChildrenForAlbum = getChildrenForAlbum as any

    // Simulate Plex returning { Metadata: singleObject } instead of { Metadata: [array] }
    mockGetChildrenForArtist.mockResolvedValue({
      MediaContainer: {
        ...makeAlbumLibraryResponse([makeAlbumItem()]).MediaContainer,
        Metadata: makeAlbumItem() as any, // Single object, not array
      },
    })
    mockGetChildrenForAlbum.mockResolvedValue(
      makeTrackLibraryResponse([makeTrackItem()]),
    )

    const response = makeArtistLibraryResponse([makeArtistItem()])
    const result = await mapPlexMusic(response)

    expect(result.musicAlbumsArr).toHaveLength(1)
    expect(result.musicTracksArr).toHaveLength(1)
  })

  it('handles Plex API returning null or empty Metadata', async () => {
    const mockGetChildrenForArtist = getChildrenForArtist as any
    const mockGetChildrenForAlbum = getChildrenForAlbum as any

    // Simulate Plex returning no albums for an artist
    mockGetChildrenForArtist.mockResolvedValue({
      MediaContainer: {
        ...makeAlbumLibraryResponse([]).MediaContainer,
        Metadata: null as any,
      },
    })

    const response = makeArtistLibraryResponse([makeArtistItem()])
    const result = await mapPlexMusic(response)

    expect(result.musicArtistsArr).toHaveLength(1) // Artist still created
    expect(result.musicAlbumsArr).toHaveLength(0) // No albums
    expect(result.musicTracksArr).toHaveLength(0) // No tracks
  })

  it('handles API errors for album/track fetching gracefully', async () => {
    const mockGetChildrenForArtist = getChildrenForArtist as any
    const mockGetChildrenForAlbum = getChildrenForAlbum as any

    mockGetChildrenForArtist.mockRejectedValue(new Error('API error'))

    const response = makeArtistLibraryResponse([makeArtistItem()])
    const result = await mapPlexMusic(response)

    // Artist is still added even if fetching albums fails
    expect(result.musicArtistsArr).toHaveLength(1)
    expect(result.musicAlbumsArr).toHaveLength(0)
  })
})
