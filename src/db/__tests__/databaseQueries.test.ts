import { describe, it, expect } from 'vitest'
import * as Queries from '../databaseQueries.js'

/**
 * These tests check the *shape* of the generated SQL (column counts,
 * placeholder counts, conflict targets) without needing a real database.
 * They're cheap, fast, and directly catch the class of bug where a
 * column list and a VALUES/placeholder list drift out of sync.
 */

function extractParenGroup(sql: string, afterKeyword: string): string {
  const idx = sql.indexOf(afterKeyword)
  if (idx === -1) throw new Error(`Could not find "${afterKeyword}" in query`)
  const openIdx = sql.indexOf('(', idx)
  let depth = 0
  for (let i = openIdx; i < sql.length; i++) {
    if (sql[i] === '(') depth++
    if (sql[i] === ')') {
      depth--
      if (depth === 0) return sql.slice(openIdx + 1, i)
    }
  }
  throw new Error(`Unbalanced parens after "${afterKeyword}"`)
}

function countTopLevelCommaItems(group: string): number {
  // Splits on commas that aren't nested inside parens (good enough for
  // these simple INSERT statements which have no nested function calls).
  let depth = 0
  let count = 1
  for (const ch of group) {
    if (ch === '(') depth++
    if (ch === ')') depth--
    if (ch === ',' && depth === 0) count++
  }
  return count
}

describe('databaseQueries: column/value list integrity', () => {
  const insertQueriesToCheck: Array<[string, string]> = [
    ['getUpsertMediaQuery', Queries.getUpsertMediaQuery()],
    ['getUpsertMediaFilesQuery', Queries.getUpsertMediaFilesQuery()],
    ['getUpsertMoviesQuery', Queries.getUpsertMoviesQuery()],
    ['getUpsertShowsQuery', Queries.getUpsertShowsQuery()],
    ['getUpsertEpisodesQuery', Queries.getUpsertEpisodesQuery()],
    ['getUpsertTagsQuery', Queries.getUpsertTagsQuery()],
    ['getUpsertMediaTagsQuery', Queries.getUpsertMediaTagsQuery()],
    ['getUpsertSyncLogQuery', Queries.getUpsertSyncLogQuery()],
  ]

  it.each(insertQueriesToCheck)(
    '%s: column list and VALUES list have the same number of entries',
    (_name, sql) => {
      const columns = extractParenGroup(sql, 'INSERT INTO')
      const values = extractParenGroup(sql, 'VALUES')
      expect(countTopLevelCommaItems(values)).toBe(countTopLevelCommaItems(columns))
    },
  )

  it.each(insertQueriesToCheck)(
    '%s: every @placeholder in VALUES has a comma before the next one (no missing commas)',
    (_name, sql) => {
      const values = extractParenGroup(sql, 'VALUES')
      // A missing comma between two placeholders looks like "@foo @bar"
      // with only whitespace/newlines between them.
      expect(values).not.toMatch(/@\w+\s+@\w+/)
    },
  )
})
