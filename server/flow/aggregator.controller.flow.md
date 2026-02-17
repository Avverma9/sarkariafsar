# Aggregator Controller Flow

Controller file: `src/controllers/aggregator.controller.mjs`
Route file: `src/routes/aggregator.routes.mjs`
Mounted as: `/api/site/*`

## Endpoints
- `POST /api/site/site` -> `addSite`
- `GET /api/site/sites` -> `getSites`
- `PUT /api/site/site/:id/status` -> `updateStatus`
- `POST /api/site/sync` -> `runMegaSync`
- `GET /api/site/mega-sections` -> `getMegaSections`
- `GET /api/site/mega-posts?slug=&page=&limit=` -> `getMegaPosts`

## Flow (sync)
```mermaid
flowchart TD
A[Request POST /api/site/sync] --> B[syncMegaSectionsAndPosts service]
B --> C[Fetch active sites]
C --> D[Scrape sections per site]
D --> E[Map to mega sections]
E --> F[Upsert MegaSection docs]
F --> G[Scrape posts from each source section]
G --> H[Dedupe + upsert MegaPost]
H --> I[Update lastChecked]
I --> J[Response: megaSaved/postsInserted/report]
```

## What It Does
- Maintains list of source sites and their active/inactive status.
- Builds normalized mega sections.
- Syncs section posts into `MegaPost` with dedupe keys.
- Provides paginated read API for mega posts.
