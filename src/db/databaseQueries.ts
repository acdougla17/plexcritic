/*********************************************
 * Queries for 'media' table
 * *******************************************/
export function getUpsertMediaQuery() {
  return `INSERT INTO media (
        ratingKey, 
        type, 
        title, 
        year, 
        dateAdded,
        originallyAvailableAt, 
        duration, 
        libraryName,
        librarySectionKey, 
        lastRefreshed,
        viewCount,
        lastViewedAt
    ) VALUES (
        @ratingKey, 
        @type, 
        @title, 
        @year, 
        @dateAdded,
        @originallyAvailableAt, 
        @duration, 
        @libraryName,
        @librarySectionKey, 
        @lastRefreshed,
        @viewCount,
        @lastViewedAt
    )
    ON CONFLICT(ratingKey) DO UPDATE SET
        title = excluded.title,
        year = excluded.year,
        duration = excluded.duration,
        lastRefreshed = excluded.lastRefreshed`
}

export function getDeleteMediaQuery() {
  return ` DELETE FROM media WHERE ratingKey = @ratingKey`
}

/*********************************************
 * Queries for 'media_files' table
 * *******************************************/
export function getUpsertMediaFilesQuery() {
  return `INSERT INTO media_files (
        id,
        ratingKey, 
        audioCodec,
        videoCodec,
        videoResolution,
        container,
        file
    ) VALUES (
        @id,
        @ratingKey, 
        @audioCodec,
        @videoCodec,
        @videoResolution,
        @container,
        @file
    )
    ON CONFLICT(id) DO UPDATE SET
        audioCodec = excluded.audioCodec,
        videoCodec = excluded.videoCodec,
        videoResolution = excluded.videoResolution,
        container =  excluded.container,
        file = excluded.file`
}

export function getDeleteMediaByRatingKeyQuery() {
  return ` DELETE FROM media_files WHERE ratingKey = @ratingKey`
}

export function getDeleteMediaByIdQuery() {
  return ` DELETE FROM media_files WHERE id = @id`
}

/*********************************************
 * Queries for 'media_tags' table
 * *******************************************/
export function getUpsertMediaTagsQuery() {
  return `INSERT INTO media_tags (ratingKey, tagId)
  VALUES (@ratingKey, @tagId)
  ON CONFLICT DO NOTHING`
}

export function getDeleteMediaTagsQuery() {
  return ` DELETE FROM media_tags WHERE ratingKey = @ratingKey`
}

/*********************************************
 * Queries for 'movies' table
 * *******************************************/
export function getUpsertMoviesQuery() {
  return `INSERT INTO movies (
        ratingKey, 
        studio,
        tagLine,
        contentRating,
        contentRatingAge,
        audienceRating,
        coverPosterUrl
    ) VALUES (
        @ratingKey, 
        @studio,
        @tagLine,
        @contentRating,
        @contentRatingAge,
        @audienceRating,
        @coverPosterUrl
    )
    ON CONFLICT(ratingKey) DO UPDATE SET
        studio = excluded.studio,
        tagLine = excluded.tagLine,
        contentRating = excluded.contentRating,
        contentRatingAge = excluded.contentRatingAge,
        audienceRating = excluded.audienceRating,
        coverPosterUrl = excluded.coverPosterUrl`
}

export function getDeleteMoviesQuery() {
  return ` DELETE FROM movies WHERE ratingKey = @ratingKey`
}

/*********************************************
 * Queries for 'shows' table
 * *******************************************/
export function getUpsertShowsQuery() {
  return `INSERT INTO shows (
        ratingKey, 
        studio,
        contentRating,
        contentRatingAge,
        audienceRating,
        coverPosterUrl,
        leafCount,
        viewedLeafCount
    ) VALUES (
        @ratingKey, 
        @studio,
        @contentRating,
        @contentRatingAge,
        @audienceRating,
        @coverPosterUrl,
        @leafCount,
        @viewedLeafCount
    )
    ON CONFLICT(ratingKey) DO UPDATE SET
        studio = excluded.studio,
        contentRating = excluded.contentRating,
        contentRatingAge = excluded.contentRatingAge,
        audienceRating = excluded.audienceRating,
        coverPosterUrl = excluded.coverPosterUrl`
}

export function getDeleteShowsQuery() {
  return ` DELETE FROM shows WHERE ratingKey = @ratingKey`
}

/*********************************************
 * Queries for 'episodes' table
 * *******************************************/
export function getUpsertEpisodesQuery() {
  return `INSERT INTO episodes (
        ratingKey, 
        showRatingKey,
        seasonNumber,
        episodeNumber
    ) VALUES (
        @ratingKey, 
        @showRatingKey,
        @seasonNumber,
        @episodeNumber
    )
    ON CONFLICT(ratingKey) DO UPDATE SET
        showRatingKey = excluded.showRatingKey,
        seasonNumber = excluded.seasonNumber`
}

export function getDeleteEpisodesQuery() {
  return ` DELETE FROM episodes WHERE ratingKey = @ratingKey`
}

/*********************************************
 * Queries for 'critic_reviews' table
 * *******************************************/
export function getUpsertCriticReviewsQuery() {
  return `INSERT INTO critic_reviews (
        id, 
        ratingKey,
        criticName,
        score,
        reviewText,
        reviewDate,
        category
    ) VALUES (
        @id,
        @ratingKey, 
        @criticName,
        @score,
        @reviewText,
        @reviewDate,
        @category
    )
    ON CONFLICT(id) DO UPDATE SET
        ratingKey = excluded.ratingKey,
        criticName = excluded.criticName,
        score = excluded.score,
        reviewText = excluded.reviewText,
        reviewDate = excluded.reviewDate,
        category = excluded.category`
}

export function getDeleteCriticReviewsByRatingKeyQuery() {
  return ` DELETE FROM critic_reviews WHERE ratingKey = @ratingKey`
}

export function getDeleteCriticReviewsByIdQuery() {
  return ` DELETE FROM critic_reviews WHERE id = @id`
}

/*********************************************
 * Queries for 'tags' table
 * *******************************************/
export function getUpsertTagsQuery() {
  return `INSERT INTO tags (
        tagType,
        name
    ) VALUES (
        @tagType, 
        @name
    )
    ON CONFLICT(tagType,name) DO UPDATE SET
        tagType = excluded.tagType,
        name = excluded.name`
}

export function getDeleteTagsQuery() {
  return `DELETE FROM tags WHERE id = @id`
}

export function getTagId() {
  return `SELECT id FROM tags WHERE tagType = @tagType AND name = @tagName`
}

/*********************************************
 * Queries for 'sync_log' table
 * *******************************************/
export function getUpsertSyncLogQuery() {
  return `INSERT INTO sync_log (
        ratingKey,
        lastSynced,
        logEntry
    ) VALUES (
        @ratingKey, 
        @lastSynced,
        @logEntry
    )
    ON CONFLICT(id) DO UPDATE SET
        ratingKey = excluded.ratingKey,
        lastSynced = excluded.lastSynced,
        logEntry = excluded.logEntry`
}

export function getDeleteSyncLogByRatingKeyQuery() {
  return ` DELETE FROM sync_log WHERE ratingKey = @ratingKey`
}

export function getDeleteSyncLogByIdQuery() {
  return ` DELETE FROM sync_log WHERE id = @id`
}

/*********************************************
 * Queries for 'music_artists' table
 * *******************************************/
export function getUpsertMusicArtistsQuery() {
  return `INSERT INTO music_artists (
        id,
        name
    ) VALUES (
        @id, 
        @name
    )
    ON CONFLICT(id) DO UPDATE SET
        name = excluded.name`
}

export function getDeleteMusicArtistsQuery() {
  return ` DELETE FROM music_artists WHERE id = @id`
}

/*********************************************
 * Queries for 'music_albums' table
 * *******************************************/
export function getUpsertMusicAlbumsQuery() {
  return `INSERT INTO music_albums (
        id,
        artistId,
        title,
        year
    ) VALUES (
        @id, 
        @artistId,
        @title,
        @year
    )
    ON CONFLICT(id) DO UPDATE SET
        artistId = excluded.artistId,
        title = excluded.title,
        year = excluded.year`
}

export function getDeleteMusicAlbumsQuery() {
  return ` DELETE FROM music_albums WHERE id = @id`
}

/*********************************************
 * Queries for 'music_tracks' table
 * *******************************************/
export function getUpsertMusicTracksQuery() {
  return `INSERT INTO music_tracks (
        ratingKey,
        artistId,
        albumId,
        trackNumber
    ) VALUES (
        @ratingKey, 
        @artistId,
        @albumId,
        @trackNumber
    )
    ON CONFLICT(ratingKey) DO UPDATE SET
        artistId = excluded.artistId,
        albumId = excluded.albumId,
        trackNumber = excluded.trackNumber`
}
