import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
    // Run test files one at a time. database.test.ts and databaseQueries tests
    // share the module-level `db` singleton from src/db/database.ts, so
    // parallel file execution could cause cross-test interference.
    fileParallelism: false,
  },
})
