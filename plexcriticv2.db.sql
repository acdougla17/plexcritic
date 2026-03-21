BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "critic_reviews" (
	"id"	INTEGER,
	"ratingKey"	TEXT,
	"criticName"	TEXT,
	"score"	REAL,
	"reviewText"	TEXT,
	"reviewDate"	INTEGER,
	"category"	TEXT,
	PRIMARY KEY("id" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "episodes" (
	"ratingKey"	TEXT,
	"showRatingKey"	TEXT,
	"seasonNumber"	INTEGER,
	"episodeNumber"	INTEGER,
	PRIMARY KEY("ratingKey"),
	FOREIGN KEY("ratingKey") REFERENCES "media"("ratingKey"),
	FOREIGN KEY("showRatingKey") REFERENCES "shows"("ratingKey")
);
CREATE TABLE IF NOT EXISTS "media" (
	"ratingKey"	TEXT,
	"type"	TEXT NOT NULL,
	"title"	TEXT NOT NULL,
	"year"	INTEGER,
	"dateAdded"	INTEGER,
	"originallyAvailableAt"	TEXT,
	"duration"	INTEGER,
	"libraryName"	TEXT,
	"librarySectionKey"	TEXT,
	"lastRefreshed"	INTEGER,
	PRIMARY KEY("ratingKey")
);
CREATE TABLE IF NOT EXISTS "media_files" (
	"id"	INTEGER,
	"ratingKey"	TEXT,
	"audioCodec"	TEXT,
	"videoCodec"	TEXT,
	"videoResolution"	TEXT,
	"videoFrameRate"	INTEGER,
	"container"	TEXT,
	"file"	TEXT,
	PRIMARY KEY("id"),
	FOREIGN KEY("ratingKey") REFERENCES "media"("ratingKey")
);
CREATE TABLE IF NOT EXISTS "media_tags" (
	"ratingKey"	TEXT,
	"tagId"	INTEGER
);
CREATE TABLE IF NOT EXISTS "movies" (
	"ratingKey"	TEXT,
	"studio"	TEXT,
	"tagLine"	TEXT,
	"contentRating"	TEXT,
	"contentRatingAge"	INTEGER,
	"audienceRating"	REAL,
	"coverPosterUrl"	TEXT,
	PRIMARY KEY("ratingKey"),
	FOREIGN KEY("ratingKey") REFERENCES "media"("ratingKey")
);
CREATE TABLE IF NOT EXISTS "music_albums" (
	"id"	INTEGER,
	"artistId"	INTEGER,
	"title"	TEXT,
	"year"	INTEGER,
	PRIMARY KEY("id" AUTOINCREMENT),
	FOREIGN KEY("artistId") REFERENCES "music_artists"("id")
);
CREATE TABLE IF NOT EXISTS "music_artists" (
	"id"	INTEGER,
	"name"	TEXT,
	PRIMARY KEY("id" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "music_tracks" (
	"ratingKey"	TEXT,
	"artistId"	INTEGER,
	"albumId"	INTEGER,
	"trackNumber"	INTEGER,
	PRIMARY KEY("ratingKey"),
	FOREIGN KEY("albumId") REFERENCES "music_albums"("id"),
	FOREIGN KEY("artistId") REFERENCES "music_artists"("id"),
	FOREIGN KEY("ratingKey") REFERENCES "media"("ratingKey")
);
CREATE TABLE IF NOT EXISTS "shows" (
	"ratingKey"	TEXT,
	"studio"	TEXT,
	"contentRating"	TEXT,
	"contentRatingAge"	TEXT,
	"audienceRating"	REAL,
	"coverPosterUrl"	TEXT,
	PRIMARY KEY("ratingKey"),
	FOREIGN KEY("ratingKey") REFERENCES "media"("ratingKey")
);
CREATE TABLE IF NOT EXISTS "sync_log" (
	"id"	INTEGER,
	"ratingKey"	TEXT,
	"lastSynced"	INTEGER,
	PRIMARY KEY("id" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "tags" (
	"id"	INTEGER,
	"tagType"	TEXT,
	"name"	TEXT,
	PRIMARY KEY("id" AUTOINCREMENT),
	UNIQUE("tagType","name")
);
CREATE INDEX IF NOT EXISTS "idx_media_dateAdded" ON "media" (
	"dateAdded"
);
CREATE INDEX IF NOT EXISTS "idx_media_duration" ON "media" (
	"duration"
);
CREATE INDEX IF NOT EXISTS "idx_media_title" ON "media" (
	"title"
);
CREATE INDEX IF NOT EXISTS "idx_media_type" ON "media" (
	"type"
);
CREATE INDEX IF NOT EXISTS "idx_media_year" ON "media" (
	"year"
);
CREATE INDEX IF NOT EXISTS "idx_tags_unique" ON "tags" (
	"tagType",
	"name"
);
COMMIT;
