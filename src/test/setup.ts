// Runs before every test file. Forces the app to use an in-memory SQLite
// database instead of the real plexcriticv2.db on disk, so tests never
// touch (or need) your actual library data.
process.env.DB_PATH = ':memory:'

// Dummy Plex connection details so config.ts doesn't throw on import
// in environments without a .env file (e.g. CI).
process.env.PLEX_URL ??= '127.0.0.1'
process.env.PLEX_PORT ??= '32400'
process.env.PLEX_TOKEN ??= 'test-token'
