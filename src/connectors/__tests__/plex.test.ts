import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'

vi.mock('axios')

import { getPlexLibrary, getAllItemsInSection, makePlexRequest } from '../plex.js'

const mockedAxios = vi.mocked(axios, true)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('makePlexRequest', () => {
  it('sends a GET request with the Plex token as a query param', async () => {
    mockedAxios.get.mockResolvedValue({ data: { ok: true } })

    const result = await makePlexRequest('/some/endpoint')

    expect(result).toEqual({ ok: true })
    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining('/some/endpoint'),
      expect.objectContaining({
        params: expect.objectContaining({ 'X-Plex-Token': expect.any(String) }),
      }),
    )
  })

  it('sends a POST request when requestType is POST', async () => {
    mockedAxios.post.mockResolvedValue({ data: { created: true } })
    const result = await makePlexRequest('/some/endpoint', 'POST')
    expect(result).toEqual({ created: true })
    expect(mockedAxios.post).toHaveBeenCalled()
  })

  it('sends a DELETE request when requestType is DELETE', async () => {
    mockedAxios.delete.mockResolvedValue({ data: { removed: true } })
    const result = await makePlexRequest('/some/endpoint', 'DELETE')
    expect(result).toEqual({ removed: true })
    expect(mockedAxios.delete).toHaveBeenCalled()
  })

  it('propagates errors from the underlying request', async () => {
    mockedAxios.get.mockRejectedValue(new Error('network down'))
    await expect(makePlexRequest('/some/endpoint')).rejects.toThrow('network down')
  })
})

describe('getPlexLibrary', () => {
  it('categorizes sections into movies, shows, music, and other by agent string', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        MediaContainer: {
          Directory: [
            { agent: 'tv.plex.agents.movie', key: '1', title: 'Movies' },
            { agent: 'tv.plex.agents.series', key: '2', title: 'TV Shows' },
            { agent: 'tv.plex.agents.music', key: '3', title: 'Music' },
            { agent: 'com.plexapp.agents.none', key: '4', title: 'Photos' },
          ],
        },
      },
    })

    const result = await getPlexLibrary()

    expect(result.movies).toHaveLength(1)
    expect(result.movies[0]?.key).toBe('1')
    expect(result.shows).toHaveLength(1)
    expect(result.shows[0]?.key).toBe('2')
    expect(result.music).toHaveLength(1)
    expect(result.music[0]?.key).toBe('3')
    expect(result.other).toHaveLength(1)
    expect(result.other[0]?.key).toBe('4')
  })

  it('propagates errors instead of silently returning an empty library', async () => {
    mockedAxios.get.mockRejectedValue(new Error('Plex is down'))
    await expect(getPlexLibrary()).rejects.toThrow('Plex is down')
  })
})

describe('getAllItemsInSection', () => {
  it('requests the correct endpoint for the given section key', async () => {
    mockedAxios.get.mockResolvedValue({
      data: { MediaContainer: { Metadata: [], librarySectionTitle: 'Movies' } },
    })

    await getAllItemsInSection('7')

    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining('/library/sections/7/all'),
      expect.anything(),
    )
  })
})
