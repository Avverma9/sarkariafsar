# API Usage Guide

Base URL (local): `http://localhost:5000`  
API prefix: `/api`

## Health
1. `GET http://localhost:5000/health`  
Use: Server health check.

2. `GET http://localhost:5000/`  
Use: Basic root check.

## Site / Aggregator APIs
Route group: `/api/site`

1. `POST http://localhost:5000/api/site/site`  
Use: New source site add karna.  
Body:
```json
{
  "name": "sarkariresult",
  "url": "https://sarkariresult.com.cm/"
}
```

2. `GET http://localhost:5000/api/site/sites`  
Use: All source sites fetch karna.

3. `PUT http://localhost:5000/api/site/site/:id/status`  
Use: Site active/inactive karna.  
Body:
```json
{ "status": "active" }
```
Allowed values: `active`, `inactive`

4. `POST http://localhost:5000/api/site/sync`  
Use: Background mega sync trigger karna.  
Response: `202` with `queued: true|false`.

5. `GET http://localhost:5000/api/site/mega-sections`  
Use: Mega sections list.

6. `GET http://localhost:5000/api/site/mega-posts?slug=latest-gov-jobs&page=1&limit=20`  
Use: Mega posts pagination with optional slug filter.

7. `GET http://localhost:5000/api/site/post-list-by-section-url?megaTitle=Latest%20Gov%20Jobs&page=1&limit=100`  
Use: Fast listing API for frontend (`postId`, `title`, `canonicalKey`, `megaTitle`, `postDate`).

8. `GET http://localhost:5000/api/site/find-by-title?title=railway+group+d+recruitment&page=1&limit=20`  
Use: MegaPost title search (case-insensitive).

9. `POST http://localhost:5000/api/site/find-by-title`  
Use: Same search via request body.  
Body:
```json
{
  "title": "railway group d recruitment",
  "megaSlug": "latest-gov-jobs",
  "sectionUrl": "https://example.com/latest-jobs",
  "exact": false,
  "page": 1,
  "limit": 20
}
```
Response data includes: `postId` (MegaPost id), `postDetailId` (if available), `title`, `applicationLastDate`, `jobType` (`APPLICATION|ADMIT_CARD|RESULT|ANSWER_KEY|...`).

10. `POST http://localhost:5000/api/site/favorite-job`  
Use: MegaPost me favorite mark/unmark karna.  
Body:
```json
{
  "canonicalKey": "assistant-date-development-grade-last-nabard-3b9c4353",
  "megaSlug": "latest-gov-jobs",
  "isFavorite": true
}
```

11. `GET http://localhost:5000/api/site/favorite-jobs?page=1&limit=20&megaSlug=latest-gov-jobs`  
Use: Favorite jobs list fetch karna (optional `megaSlug` filter).
Response data includes: `canonicalKey`, `recruitmentTitle`, `applicationLastDate`, `organizationShortName`, `recruitment.organization.shortName`.

12. `GET http://localhost:5000/api/site/deadline-jobs?days=3&page=1&limit=50`  
Use: `applicationLastDate` ke basis par upcoming deadline jobs.

13. `POST http://localhost:5000/api/site/deadline-jobs`  
Use: Same deadline filter via body.  
Body:
```json
{
  "days": 5,
  "page": 1,
  "limit": 50
}
```

## Sections APIs
Route group: `/api/sections`

1. `GET http://localhost:5000/api/sections/get-sections`  
Use: Active sites ke live sections scrape karke return karna.

## Post Extraction / Update APIs
Route group: `/api/post`

1. `POST http://localhost:5000/api/post/scrape`  
Use: Recruitment JSON extract/cache karna from MegaPost.

Body option A (preferred):
```json
{
  "canonicalKey": "assistant-date-development-grade-last-nabard-3b9c4353",
  "megaSlug": "latest-gov-jobs"
}
```

Body option B:
```json
{
  "postId": "66f0a1b2c3d4e5f678901234"
}
```

2. `POST http://localhost:5000/api/post/update`  
Use: Single ya batch post update tracking (no Gemini in update flow).

Single body:
```json
{
  "postId": "66f0a1b2c3d4e5f678901234",
  "matchThreshold": 0.8,
  "maxCandidates": 5,
  "force": false
}
```

Batch body:
```json
{
  "limit": 20,
  "matchThreshold": 0.8,
  "maxCandidates": 5,
  "force": false
}
```

3. `POST http://localhost:5000/api/post/track-changes`  
Use: Alias of `/api/post/update`.

## Gemini Admin APIs
Route group: `/api/gemini`

1. `GET http://localhost:5000/api/gemini/models`  
Use: Gemini models list.

2. `POST http://localhost:5000/api/gemini/models`  
Use: Model save/update.
```json
{
  "modelName": "gemini-1.5-flash",
  "status": true,
  "priority": 100
}
```

3. `PATCH http://localhost:5000/api/gemini/models/status`  
Use: Existing model enable/disable.
```json
{
  "modelName": "gemini-1.5-flash",
  "status": true
}
```

4. `GET http://localhost:5000/api/gemini/keys`  
Use: Gemini API keys list.

5. `POST http://localhost:5000/api/gemini/keys`  
Use: Single key add/update.
```json
{
  "apiKey": "AIza...",
  "label": "primary",
  "priority": 100,
  "status": "ACTIVE"
}
```

6. `POST http://localhost:5000/api/gemini/keys/bulk`  
Use: Bulk keys upsert.
```json
{
  "keys": [
    {
      "apiKey": "AIza...1",
      "label": "k1",
      "priority": 100,
      "status": "ACTIVE"
    },
    {
      "apiKey": "AIza...2",
      "label": "k2",
      "priority": 90,
      "status": "INACTIVE"
    }
  ]
}
```

## Watch APIs
Route group: `/api/watch`

1. `POST http://localhost:5000/api/watch`  
Use: User email ke liye recruitment notification watch create/update.

Important:
- Backward-compatible `postId` ab **PostDetail._id ya MegaPost._id** dono accept karta hai.
- Aap `postDetailId`, `megaPostId`, ya `canonicalKey` (+ optional `megaSlug`) bhi bhej sakte ho.
- Agar `canonicalKey` se resolve karna ho to latest matched MegaPost use hota hai.

Body:
```json
{
  "email": "user@example.com",
  "postId": "POSTDETAIL_OR_MEGAPOST_OBJECT_ID",
  "enabled": true,
  "priority": 10,
  "channels": {
    "email": true,
    "whatsapp": false
  }
}
```

Alternative body (canonical key based):
```json
{
  "email": "user@example.com",
  "canonicalKey": "assistant-date-development-grade-last-nabard-3b9c4353",
  "megaSlug": "latest-gov-jobs",
  "enabled": true
}
```

## Recruitment APIs
Route group: `/api/recruitment`

1. `POST http://localhost:5000/api/recruitment/process-post`  
Use: Single MegaPost ko recruitment entity + events me process karna.
```json
{
  "postId": "MEGAPOST_OBJECT_ID"
}
```

## Cron Helper APIs
Route group: `/api/cron`

1. `POST http://localhost:5000/api/cron/process-new-posts`  
Use: Unprocessed MegaPosts (`aiScraped=false`) ko batch me process karna.
```json
{
  "limit": 20
}
```

2. `POST http://localhost:5000/api/cron/watch-sweep`  
Use: Watched recruitments ke related unprocessed posts process karna.
```json
{
  "limit": 50
}
```

## Suggested Workflow
1. `POST /api/site/site` se source sites add karo.
2. `POST /api/site/sync` se MegaPost sync trigger karo.
3. `POST /api/post/scrape` se PostDetail + formatted recruitment JSON cache karo.
4. `POST /api/watch` me user email + (`postId` as PostDetail/MegaPost id OR `canonicalKey`) dekar watch on karo.
5. `POST /api/cron/process-new-posts` aur `POST /api/cron/watch-sweep` schedule karo for continuous notifications.
