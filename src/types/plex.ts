/****************************************************
 * Plex Library Types
 *****************************************************/
export interface PlexLibrary {
  movies: PlexLibrarySection[]
  shows: PlexLibrarySection[]
  music: PlexLibrarySection[]
  other: PlexLibrarySection[]
}

export interface PlexSectionMediaContainer {
  size: number
  allowCameraUpload: boolean
  allowChannelAccess: boolean
  allowMediaDeletion: boolean
  allowSharing: boolean
  allowSync: boolean
  allowTuners: boolean
  backgroundProcessing: boolean
  certificate: boolean
  companionProxy: boolean
  countryCode: string
  diagnostics: string
  eventStream: boolean
  friendlyName: string
  hubSearch: boolean
  itemClusters: boolean
  livetv: number
  machineIdentifier: string
  mediaProviders: boolean
  multiuser: boolean
  musicAnalysis: number
  myPlex: boolean
  myPlexMappingState: string
  myPlexSigninState: string
  myPlexSubscription: boolean
  myPlexUsername: string
  offlineTranscode: number
  ownerFeatures: string
  platform: string
  platformVersion: string
  pluginHost: boolean
  pushNotifications: boolean
  readOnlyLibraries: boolean
  streamingBrainABRVersion: number
  streamingBrainVersion: number
  sync: boolean
  transcoderActiveVideoSessions: number
  transcoderAudio: boolean
  transcoderLyrics: boolean
  transcoderPhoto: boolean
  transcoderSubtitles: boolean
  transcoderVideo: boolean
  transcoderVideoBitrates: string
  transcoderVideoQualities: string
  transcoderVideoResolutions: string
  updatedAt: number
  updater: boolean
  version: string
  voiceSearch: boolean
  Directory: [PlexLibrarySection]
}

export interface PlexLibraryLocation {
  id: number
  path: string
}

export interface PlexLibrarySection {
  allowSync: boolean
  filters: boolean
  refreshing: boolean
  key: string
  type: string
  title: string
  agent: string
  scanner: string
  language: string
  uuid: string
  updatedAt: number
  createdAt: number
  scannedAt: number
  content: boolean
  directory: boolean
  contentChangedAt: number
  hidden: number
  Location: [PlexLibraryLocation]
}

export interface PlexLibraryResponse {
  MediaContainer: PlexSectionMediaContainer
}

/****************************************************
 * Plex Library Items Types
 *****************************************************/
export interface PlexLibraryItemResponse {
  MediaContainer: {
    allowSync: boolean
    art: string
    identifier: string
    librarySectionID: number
    librarySectionTitle: string
    librarySectionUUID: string
    mediaTagPrefix: string
    mediaTagVersion: number
    size: number
    thumb: string
    title1: string
    title2: string
    viewGroup: string
    viewMode: string
    Metadata: [PlexLibraryItem]
  }
}

export interface PlexLibraryItem {
  addedAt: number
  art: string
  chapterSource: string
  contentRating: string
  duration: number
  key: string
  originallyAvailableAt: string
  primaryExtraKey: string
  rating: number
  ratingKey: string
  studio: string
  summary: string
  tagline: string
  thumb: string
  title: string
  type: string
  updatedAt: number
  year: number
  Media: [
    {
      aspectRatio: number
      audioChannels: number
      audioCodec: string
      bitrate: number
      container: string
      duration: number
      height: number
      id: number
      videoCodec: string
      videoFrameRate: string
      videoResolution: string
      width: number
      Part: [
        {
          container: string
          duration: number
          file: string
          id: number
          key: string
          size: number
        },
      ]
    },
  ]
  Genre: [PlexTag]
  Writer: [PlexTag]
  Director: [PlexTag]
  Country: [PlexTag]
  Role: [PlexTag]
  Collection: [PlexTag]
  Image: [
    {
      alt: string
      type: string
      url: string
    },
  ]
}

interface PlexTag {
  tag: string
}
