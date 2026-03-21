export interface MovieContainer {
  moviesArr: Movie[]
  mediaArr: Media[]
  mediaFilesArr: MediaFiles[]
  tagsArr: Tags[]
  mediaTagLinks: MediaTagLink[]
}

export interface Movie {
  ratingKey: string
  studio: string
  tagLine: string
  contentRating: string
  contentRatingAge: number
  audienceRating: number
  coverPosterUrl: string
}

export interface ShowContainer {
  showsArr: Show[]
  episodesArr: Episode[]
  mediaArr: Media[]
  mediaFilesArr: MediaFiles[]
  tagsArr: Tags[]
  mediaTagLinks: MediaTagLink[]
}

export interface Show {
  ratingKey: string
  studio: string
  contentRating: string
  contentRatingAge: number
  audienceRating: number
  coverPosterUrl: string
}

export interface Episode {
  ratingKey: string
  showRatingKey: string
  seasonNumber: number
  episodeNumber: number
}

export interface Media {
  ratingKey: string
  type: string
  title: string
  year: number
  dateAdded: number
  originallyAvailableAt: string
  duration: number
  libraryName: string
  librarySectionKey: string
  lastRefreshed: number
}

export interface MediaFiles {
  id: number
  ratingKey: string
  audioCodec: string
  videoCodec: string
  videoResolution: string
  videoFrameRate: string
  container: string
  file: string
}

export interface MediaTags {
  ratingKey: string
  tagId: number
}

export interface MediaTagLink {
  ratingKey: string
  tagType: string
  tagName: string
}

export interface Tags {
  id?: number
  tagType: string
  name: string
}

export interface TagRow {
  id: number
}

export interface Shows {
  ratingKey: string
  title: string
  year: number
  dateAdded: number
  originallyAvailableAt: string
  genres: string
  countries: string
  directors: string
  writers: string
  actors: string
  studio: string
  contentRating: string
  contentRatingAge: number
  audienceRating: number
  tagLine: string
  addedAt: number
  audioCodec: string
  videoCodec: string
  videoResolution: string
  videoFrameRate: string
  container: string
  duration: number
  collections: string
  coverPosterUrl: string
  file: string
  lastRefreshed: number
  libraryName: string
  librarySectionKey: string
}

export interface Music {
  ratingKey: string
  title: string
}

export interface Other {
  ratingKey: string
  title: string
  year: number
  dateAdded: number
  originallyAvailableAt: string
  genres: string
  countries: string
  directors: string
  writers: string
  actors: string
  studio: string
  contentRating: string
  contentRatingAge: number
  audienceRating: number
  tagLine: string
  addedAt: number
  audioCodec: string
  videoCodec: string
  videoResolution: string
  videoFrameRate: string
  container: string
  duration: number
  collections: string
  coverPosterUrl: string
  file: string
  lastRefreshed: number
  libraryName: string
  librarySectionKey: string
}

export interface CriticDatabaseLibrary {
  movies: Movies[]
  shows: Shows[]
  music: Music[]
  other: Other[]
}
