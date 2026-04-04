/**
 * Server-side disk cache for AI-generated job summaries.
 * Each summary is stored by slug and refreshed once per day (TTL 24h).
 * File: utils/.summary-cache.json  (auto-created on first write)
 *
 * Only used inside Next.js API routes (server-side) — never in client components.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'

const CACHE_FILE = join(process.cwd(), 'utils', '.summary-cache.json')
const TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

function readCache() {
  try {
    if (!existsSync(CACHE_FILE)) return {}
    return JSON.parse(readFileSync(CACHE_FILE, 'utf8'))
  } catch {
    return {}
  }
}

function writeCache(data) {
  try {
    const dir = dirname(CACHE_FILE)
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2), 'utf8')
  } catch {
    // silent — cache write failure should never crash the API
  }
}

/**
 * Returns cached summary if it exists and is less than 24h old.
 * @param {string} slug - job post slug
 * @returns {string|null}
 */
export function getCachedSummary(slug) {
  if (!slug) return null
  const cache = readCache()
  const entry = cache[slug]
  if (!entry?.summary) return null
  if (Date.now() - new Date(entry.generatedAt).getTime() > TTL_MS) return null
  return entry.summary
}

/**
 * Saves a generated summary to the cache.
 * @param {string} slug - job post slug
 * @param {string} summary - AI-generated summary text
 */
export function setCachedSummary(slug, summary) {
  if (!slug || !summary) return
  const cache = readCache()
  cache[slug] = {
    summary,
    generatedAt: new Date().toISOString(),
  }
  writeCache(cache)
}
