# API Controller Flows

This folder documents request flow for each API controller.

## Files
- `flow/aggregator.controller.flow.md`
- `flow/section.controller.flow.md`
- `flow/postScrape.controller.flow.md`
- `flow/gemini.controller.flow.md`
- `flow/mega-sync-post-update.flow.md`

## Base Route Prefix
All routes are mounted under `/api` in `src/app.mjs`.
Agar tum **post sync** (`POST /api/site/sync`) chalate ho, to data yahan save hota hai:

1. `MegaSection` collection (Mongo: usually `megasections`)  
- source sections map hote hain  
- code: `src/services/scraper.service.mjs`

2. `MegaPost` collection (Mongo: usually `megaposts`)  
- post list entries save/upsert hoti hain (`title`, `originalUrl`, dedupe keys, etc.)  
- code: `src/services/scraper.service.mjs`

3. `AggregatorSite` (`sites`) me `lastChecked` update hota hai  
- code: `src/services/scraper.service.mjs`

Important:
- **Formatted detailed data** (`formattedData`) `PostDetail` me **sync ke time nahi** save hota.
- Wo tab save hota hai jab tum `POST /api/post/scrape` chalate ho.  
  - code: `src/controllers/postScrape.controller.mjs`  
  - model: `src/models/postdetail.model.mjs`
