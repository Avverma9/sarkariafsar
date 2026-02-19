# Scrapper API

Base URL: `/api`

## 1) Get Sections (from active sites)

Endpoint: `GET /api/sections/get-sections`

Request payload: none

Success response (`200`):

```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "siteId": "67b6d1d2af28f09f6fc12d90",
      "name": "Sarkari Result",
      "url": "https://www.sarkariresult.com",
      "sections": [
        {
          "title": "Latest Jobs",
          "url": "https://www.sarkariresult.com/latestjob/"
        },
        {
          "title": "Admit Card",
          "url": "https://www.sarkariresult.com/admitcard/"
        }
      ]
    }
  ]
}
```

If no active site found:

```json
{
  "success": true,
  "count": 0,
  "data": []
}
```

## 2) Section with Post List

Endpoint: `GET /api/site/post-list-by-section-url`

Required query:
- `megaTitle`

Optional query:
- `sectionUrl`
- `page` (default `1`)
- `limit` (default `100`, max `500`)

Example:
`GET /api/site/post-list-by-section-url?megaTitle=Latest%20Gov%20Jobs&sectionUrl=https://www.sarkariresult.com/latestjob/&page=1&limit=20`

Success response (`200`):

```json
{
  "success": true,
  "count": 2,
  "pagination": {
    "total": 42,
    "page": 1,
    "limit": 20,
    "pages": 3
  },
  "data": [
    {
      "postId": "67b6f1c2af28f09f6fc12e11",
      "title": "UP Police Recruitment 2026",
      "canonicalKey": "up-police-recruitment-2026",
      "megaTitle": "Latest Gov Jobs",
      "megaSlug": "latest-gov-jobs",
      "sourceUrl": "https://www.sarkariresult.com/up-police-2026",
      "sectionUrl": "https://www.sarkariresult.com/latestjob/",
      "postDate": "2026-02-19T10:00:00.000Z",
      "applicationLastDate": "30/03/2026"
    },
    {
      "postId": "67b6f1d7af28f09f6fc12e12",
      "title": "SSC CGL 2026",
      "canonicalKey": "ssc-cgl-2026",
      "megaTitle": "Latest Gov Jobs",
      "megaSlug": "latest-gov-jobs",
      "sourceUrl": "https://www.sarkariresult.com/ssc-cgl-2026",
      "sectionUrl": "https://www.sarkariresult.com/latestjob/",
      "postDate": "2026-02-19T11:00:00.000Z",
      "applicationLastDate": "15/04/2026"
    }
  ]
}
```

Error response (`400`, when `megaTitle` missing):

```json
{
  "success": false,
  "message": "megaTitle is required"
}
```

## 3) Mega Post Sync Trigger

Endpoint: `POST /api/site/sync`

Request payload: none

Success response (`202`, sync accepted):

```json
{
  "success": true,
  "queued": true,
  "message": "Sync started in background worker",
  "workerThreadId": 2
}
```

Success response (`202`, sync skipped because already running/cooldown):

```json
{
  "success": true,
  "queued": false,
  "message": "Sync skipped: already-running"
}
```

## Extra helpful endpoint

Endpoint: `GET /api/site/mega-posts`

Optional query:
- `slug`
- `page` (default `1`)
- `limit` (default `20`, max `100`)

Example:
`GET /api/site/mega-posts?slug=latest-gov-jobs&page=1&limit=20`

Success response (`200`):

```json
{
  "success": true,
  "pagination": {
    "total": 120,
    "page": 1,
    "limit": 20,
    "pages": 6
  },
  "data": []
}
```
