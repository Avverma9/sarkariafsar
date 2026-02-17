# Section Controller Flow

Controller file: `src/controllers/section.controller.mjs`
Route file: `src/routes/sections.routes.mjs`
Mounted as: `/api/sections/*`

## Endpoint
- `GET /api/sections/get-sections` -> `getSectionsFromActiveSites`

## Flow
```mermaid
flowchart TD
A[Request GET /api/sections/get-sections] --> B[Find active AggregatorSite records]
B --> C{Any site?}
C -- No --> D[Return empty list]
C -- Yes --> E[Scrape sections from each active site]
E --> F[Collect fulfilled results]
F --> G[Update lastChecked for active sites]
G --> H[Return count + section data]
```

## What It Does
- Aggregates section/menu links from currently active source sites.
- Handles partial scrape failures with `Promise.allSettled`.
- Returns only successful site-section payloads.
