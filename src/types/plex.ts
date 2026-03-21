/****************************************************
 * Plex Library Types
 *****************************************************/
export interface PlexLibrary {
  movies: PlexLibrarySection[]
  shows: PlexLibrarySection[]
  music: PlexLibrarySection[]
  other: PlexLibrarySection[]
}

// This is the container that holds the details for all media details
export interface PlexMedia {
  id: number
  duration: number
  bitrate: number
  width: number
  height: number
  aspectRatio: number
  audioChannels: number
  audioCodec: string
  videoCodec: string
  videoResolution: string
  container: string
  videoFrameRate: string
  audioProfile: string
  videoProfile: string
  hasVoiceActivity: boolean
  Part: [
    {
      id: number
      key: string
      duration: number
      file: string
      size: number
      audioProfile: string
      container: string
      videoProfile: string
    },
  ]
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
    key?: string
    librarySectionID: number
    librarySectionTitle: string
    librarySectionUUID: string
    mediaTagPrefix: string
    mediaTagVersion: number
    mixedParents?: boolean
    nocache?: boolean
    parentIndex?: number
    parentTitle?: string
    parentYear?: number
    theme?: string
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
  parentRatingKey?: string
  grandparentRatingKey?: string
  originallyAvailableAt: string
  index?: number
  parentIndex?: number
  lastViewedAt: number
  leafCount?: number
  viewedLeafCount?: number
  childCount?: number
  seasonCount?: number
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
  contentRatingAge: number
  audienceRating: number
  Media: [PlexMedia]
  Genre?: [PlexTag]
  Writer?: [PlexTag]
  Director?: [PlexTag]
  Country?: [PlexTag]
  Role?: [PlexTag]
  Collection?: [PlexTag]
  Label?: [PlexTag]
  Image?: [
    {
      alt: string
      type: string
      url: string
    },
  ]
}

interface PlexTag {
  id?: number
  tag: string
}

/********************TV SHOWS*********************/
export interface PlexShowMediaContainer {
  size: number
  allowSync: boolean
  art: string
  identifier: string
  key: string
  librarySectionID: number
  librarySectionTitle: string
  librarySectionUUID: string
  mediaTagPrefix: string
  mediaTagVersion: number
  mixedParents: boolean
  nocache: boolean
  parentIndex: number
  parentTitle: string
  parentYear: number
  theme: string
  title1: string
  title2: string
  viewGroup: string
  viewMode: number
  Metadata: [PlexShowItem]
}

export interface PlexShowItem {
  ratingKey: string
  key: string
  guid: string
  studio: string
  type: string
  title: string
  contentRating: string
  contentRatingAge: number
  summary: string
  index: number
  audienceRating: number
  viewCount: number
  lastViewedAt: number
  year: number
  thumb: string
  art: string
  theme: string
  duration: number
  originallyAvailableAt: string
  leafCount: number
  viewedLeafCount: number
  childCount: number
  addedAt: number
  updatedAt: number
  audienceRatingImage: string
  Media: [PlexMedia]
  Image?: [
    {
      alt: string
      type: string
      url: string
    },
  ]
  UltraBlurColors: {
    topLeft: string
    topRight: string
    bottomLeft: string
    bottomRight: string
  }
  Genre?: [PlexTag]
  Country?: [PlexTag]
  Collection?: [PlexTag]
  Role?: [PlexTag]
}
