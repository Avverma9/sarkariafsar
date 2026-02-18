# Mega Sync And Post Update Patch - Full Doc

This document explains exactly how these two pipelines work in current code:
- Mega post sync (`/api/site/sync` + scheduler)
- Post update patch (`/api/post/update` + scheduler)

It also explains what was fixed in the latest loophole patch.

## Scope

This doc covers:
- Trigger points (API + schedulers)
- Locking and concurrency behavior
- Data write/update rules
- Matching and patch logic
- Important env vars
- Operational runbook

This doc does not cover Gemini admin APIs in detail.

## Main Files

- `src/controllers/aggregator.controller.mjs`
- `src/services/scraper.service.mjs`
- `src/workers/megaSync.worker.mjs`
- `src/controllers/postScrape.controller.mjs`
- `src/services/postUpdate.service.mjs`
- `src/services/jobLock.service.mjs`
- `src/models/megaPost.model.mjs`
- `src/models/postdetail.model.mjs`
- `server.mjs`

## Route Map

- `POST /api/site/sync` -> run mega sync in worker thread
- `POST /api/post/update` -> single or batch post update patch
- `POST /api/post/track-changes` -> alias of `/api/post/update`

## Boot And Scheduler Behavior

On server boot:
- DB connect happens first.
- Schedulers start only when `RUN_SCHEDULERS=true`.
- In cluster mode, primary process keeps one scheduler worker (`worker #1`) and other workers run API only.

Related code:
- `server.mjs`

## Mega Sync Flow (Detailed)

### 1. Trigger

Two ways:
- Manual API: `POST /api/site/sync`
- Auto scheduler: `startMegaSyncScheduler()` in `src/services/scraper.service.mjs`

API returns `202`:
- `queued: true` if sync accepted
- `queued: false` if skipped because another run is already active

### 2. Concurrency and lock

Mega sync has two-level protection:
- Local process guard: `megaSyncWorker` check
- Distributed lock in Mongo: `JobLock` with key `mega-sync`

Lock details:
- Acquire: `acquireJobLock()`
- Renew heartbeat every 60 seconds: `renewJobLock()`
- Release on worker exit: `releaseJobLock()`

### 3. Worker thread

Sync runs inside `src/workers/megaSync.worker.mjs`:
- Worker establishes DB connection
- Calls `syncMegaSectionsAndPosts({ postDelayMs })`
- Sends result/error back to parent thread

### 4. Section ingestion and mega mapping

Inside `syncMegaSectionsAndPosts()`:
- Load active sites from `AggregatorSite`
- Scrape sections for each site
- Map sections into fixed mega buckets (`latest-gov-jobs`, `admit-cards`, etc.)
- Upsert `MegaSection` collection

### 5. Post scraping from each source section

For each mapped source section:
- Scrape post links and titles
- Build dedupe keys from title/url via `buildDedupeKeys()`:
  - `canonicalKey`
  - `altIdKey`
  - `altTokenKey`
  - `altUrlKey`

### 6. Existing post resolution (loophole fix)

Earlier behavior skipped on basic match. New behavior resolves better:

1. Same mega slug match:
- Query by `megaSlug + (canonical/alt keys)`

2. Cross-slug URL fallback:
- If not found, try `altUrlKey` globally

3. Cross-slug ID fallback:
- If still not found, try `altIdKey` with either same `megaTitle` or same `sourceSiteId`

Why this matters:
- If slug/canonical drifts but job is same, system prefers reusing existing document identity instead of creating duplicate `MegaPost`.

### 7. Existing post refresh behavior (loophole fix)

If existing post found:
- Metadata is refreshed (`megaSlug`, `canonicalKey`, title, source fields, URL, alt keys)
- If metadata changed or content missing:
  - Re-scrape full post detail (`contentHtml`, `contentText`)
  - If new content is fetched:
    - Store content
    - Reset `aiScraped=false`, `aiScrapedAt=null`, `lastEventProcessedAt=null`

Why reset `aiScraped`:
- So downstream recruitment/event processors can re-evaluate updated content.

### 8. New post insert behavior

If no match is found:
- Upsert by `{ megaSlug, canonicalKey }`
- Insert fields via `$setOnInsert`
- Initial `aiScraped=false`

### 9. End of sync

After all sections:
- Update `AggregatorSite.lastChecked`
- Return summary:
  - `megaSaved`
  - `postsInserted`
  - per-source report

## Post Update Patch Flow (Detailed)

### 1. Trigger

Two ways:
- API: `POST /api/post/update`
- Scheduler: `startPostUpdateScheduler()` (cron based)

Alias:
- `POST /api/post/track-changes` routes to same controller.

### 2. API modes

Single mode:
- When `postId` or `megaPostId` provided
- Calls `updateSinglePostById(postId, options)`

Batch mode:
- No `postId` provided
- Calls `runPostUpdateBatch({ limit, options })`

### 3. Scheduler lock and cadence

Post update scheduler:
- Uses cron expression `POST_UPDATE_CRON` (default `0 */2 * * *`)
- Uses distributed lock with key `post-update`
- Skips run if another worker/process already running

### 4. Batch candidate selection

Batch query conditions:
- `sourceSectionUrl` exists
- `PostDetail` exists for mega post (lookup filter)
- If `force=false`, only stale or never-checked posts:
  - stale window currently 2 hours

### 5. Matching logic for one post

`updateSinglePostById()` flow:

1. Load `MegaPost`
2. Ensure linked `PostDetail` exists, otherwise skip safely
3. Scrape current section posts as candidates
4. Build seed score per candidate:
- exact URL match = `1`
- dedupe `idKey` match raises score to at least `0.96`
- dedupe `tokenKey` match raises score to at least `0.9`
- fallback title Jaccard similarity

5. Take top `maxCandidates`
6. For shortlisted candidates:
- scrape candidate detail
- build snapshot + page hash + content hashes
- compute `hashScore`
- compute `overallScore`:
  - if base fingerprint exists: `0.65 * hashScore + 0.35 * seedScore`
  - else: seed score

7. Pick best candidate
8. If score below threshold (`matchThreshold`), mark not matched and exit

### 6. Patch decision logic

Patch is applied when any one is true:
- URL changed
- Page hash changed
- Tracked field diffs found
- Previous content was missing
- Content hash changed (`htmlStableHash` or `textHash`)

### 7. What gets updated

If patch is needed:
- `MegaPost.originalUrl`
- `MegaPost.title`
- `MegaPost.contentHtml`
- `MegaPost.contentText`
- `MegaPost.updateSnapshot`
- `MegaPost.pageHash`
- `MegaPost.lastPostFingerprintHash`

Always after save (new fix):
- Sync metadata into `PostDetail`:
  - `postTitle`
  - `sourceUrl`
  - `pageHash`
  - `htmlStableHash`
  - `textHash`
  - `updateSnapshot`
  - `lastScrapedAt`

Why this matters:
- Prevents stale `PostDetail` metadata after patch updates.

### 8. Notification behavior

If patch applied:
- Build change list (tracked fields + content hash changes)
- Send update email using `sendPostUpdateNotification()`
- Record notify timestamp on success

If no patch:
- No update email
- Only check metadata remains updated

## Data Model Notes

### MegaPost

Important fields used by these flows:
- Dedupe: `canonicalKey`, `altIdKey`, `altTokenKey`, `altUrlKey`
- Source: `sourceSiteId`, `sourceSiteName`, `sourceSectionUrl`
- Content: `contentHtml`, `contentText`
- AI/recruitment flags: `aiScraped`, `aiScrapedAt`, `recruitmentId`, `recruitmentKey`
- Patch metadata: `updateSnapshot`, `pageHash`, `lastPost*`

Important index:
- Unique: `{ megaSlug: 1, canonicalKey: 1 }`

### PostDetail

Used as one-to-one detail/cache doc per mega post:
- Unique index: `{ megaPostId: 1 }`
- Stores `formattedData` plus patch metadata hashes.

## Env Variables

### Mega sync

- `MEGA_SYNC_SCHEDULER_ENABLED` (default `true`)
- `MEGA_SYNC_INTERVAL_MINUTES` (default `30`)
- `MEGA_SYNC_POST_DELAY_MS` (default `60000`)
- `MEGA_SYNC_LOCK_TTL_MS` (default `90m`)

### Post update patch

- `POST_UPDATE_SCHEDULER_ENABLED` (default `true`)
- `POST_UPDATE_CRON` (default `0 */2 * * *`)
- `POST_UPDATE_BATCH_SIZE` (default `20`)
- `POST_UPDATE_MATCH_THRESHOLD` (default `0.8`)
- `POST_UPDATE_MAX_CANDIDATES` (default `5`)
- `POST_UPDATE_LOCK_TTL_MS` (default `3h`)

### Runtime

- `CLUSTER_ENABLED`
- `WEB_CONCURRENCY`
- `RUN_SCHEDULERS` (set by cluster primary per worker)

## Practical API Examples

### Trigger mega sync

```bash
curl -X POST "http://localhost:5000/api/site/sync"
```

### Patch one post by id

```bash
curl -X POST "http://localhost:5000/api/post/update" \
  -H "Content-Type: application/json" \
  -d '{
    "postId": "66f0a1b2c3d4e5f678901234",
    "matchThreshold": 0.8,
    "maxCandidates": 5,
    "force": false
  }'
```

### Batch patch

```bash
curl -X POST "http://localhost:5000/api/post/update" \
  -H "Content-Type: application/json" \
  -d '{
    "limit": 20,
    "matchThreshold": 0.8,
    "maxCandidates": 5,
    "force": false
  }'
```

## Troubleshooting Checklist

If sync says skipped:
- Check lock row for key `mega-sync`
- Check if worker already active in same process

If update batch processes nothing:
- Ensure `sourceSectionUrl` is present on target posts
- Ensure `PostDetail` exists
- Check stale window vs `lastPostUpdateCheckAt`

If patch not happening:
- Check returned `score` vs `threshold`
- Check if candidate section scraping is returning posts

If duplicate-like behavior appears:
- Verify `altUrlKey` and `altIdKey` values on related `MegaPost` docs
- Check whether source moved post across section/slug and if metadata refresh happened

## Short Summary

Mega sync now does smart identity reuse and metadata/content refresh, not just naive insert-or-skip.
Post update patch now keeps `PostDetail` metadata in sync after each update run.
Together these changes close the previously observed slug/canonical drift loopholes.
