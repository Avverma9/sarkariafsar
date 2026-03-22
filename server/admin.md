# Admin API Guide

Preferred base path: `/api`

The same routers are also mounted on `/`, but admin integrations should use `/api/...`.

Content type for write requests:

```http
Content-Type: application/json
```

## Common Error Shape

```json
{
  "success": false,
  "message": "Route not found: GET /api/unknown"
}
```

Some controllers return `error` instead of `message`:

```json
{
  "success": false,
  "error": "Blog not found"
}
```

---

## 1. Jobs APIs

### 1.1 Create One Job

`POST /api/jobs`

`POST /api/jobs/add-job`

Request JSON:

```json
{
  "title": "UPTET 2026: UP Teacher Eligibility Test",
  "jobtitle": "UPTET 2026: UP Teacher Eligibility Test",
  "advertisement_number": "01/UPTET/2026",
  "conducting_authority": "Uttar Pradesh Education Service Selection Commission (UPESSC)",
  "status": "Online application window is currently open on the official portal.",
  "official_links": {
    "heading": "Official Website & Links",
    "official_website": "https://www.upessc.up.gov.in/",
    "apply_online_portal": "https://uptet.upessc.org/otr/",
    "advertisement_number": "01/UPTET/2026"
  },
  "direct_links": {
    "apply_link": "https://uptet.upessc.org/otr/",
    "notification_pdf": "https://www.upessc.up.gov.in/"
  },
  "important_dates": {
    "heading": "UPTET 2026 Important Dates",
    "dates": [
      {
        "event": "Online Application Starts",
        "date": "27 March 2026"
      },
      {
        "event": "Last Date to Apply Online",
        "date": "26 April 2026"
      }
    ]
  },
  "how_to_apply": {
    "heading": "How to Apply for UPTET 2026",
    "steps": [
      {
        "step": 1,
        "action": "Visit the official website."
      },
      {
        "step": 2,
        "action": "Open the official apply portal and complete the form."
      }
    ]
  },
  "meta": {
    "description": "UPTET 2026 notification with important dates, official links, and application guidance.",
    "keywords": [
      "UPTET 2026",
      "UP Teacher Eligibility Test"
    ]
  },
  "introduction": {
    "heading": "About UPTET 2026",
    "content": "UPTET 2026 is the state teacher eligibility examination for candidates who want to teach in Uttar Pradesh schools."
  },
  "disclaimer": "Candidates should verify all details on the official UPESSC website before applying."
}
```

Success response:

```json
{
  "success": true,
  "message": "Job created successfully",
  "action": "created",
  "job": {
    "id": "69be3737cc37885588cc10eb",
    "dedupeKey": "01-uptet-2026",
    "slug": "uptet-2026-up-teacher-eligibility-test",
    "sectionCanonicalUrl": "latest-gov-jobs",
    "sectionName": "Latest Gov Jobs",
    "jobtitle": "UPTET 2026: UP Teacher Eligibility Test",
    "title": "UPTET 2026: UP Teacher Eligibility Test",
    "category": "Government Job",
    "advertisement_number": "01/UPTET/2026",
    "conducting_authority": "Uttar Pradesh Education Service Selection Commission (UPESSC)",
    "postType": "job",
    "lifecycleStage": "application_open",
    "status": "Online application window is currently open on the official portal.",
    "official_links": {
      "heading": "Official Website & Links",
      "official_website": "https://www.upessc.up.gov.in/",
      "apply_online_portal": "https://uptet.upessc.org/otr/",
      "advertisement_number": "01/UPTET/2026"
    },
    "applyLastDate": "2026-04-25T18:30:00.000Z"
  }
}
```

Notes:
- Single object or array payload both accepted.
- Rich fields from `utils/schemaType.txt` are accepted.
- Internal `aiMonitoring` is not returned in API response.

### 1.2 Bulk Create/Sync Jobs

`POST /api/jobs`

Request JSON:

```json
[
  {
    "title": "Post A",
    "jobtitle": "Post A",
    "official_links": {
      "official_website": "https://example.org"
    }
  },
  {
    "title": "Post B",
    "jobtitle": "Post B",
    "official_links": {
      "official_website": "https://example.org"
    }
  }
]
```

Success response:

```json
{
  "success": true,
  "message": "Jobs synced successfully",
  "created": 1,
  "updated": 1,
  "cloned": 0,
  "ignoredExpired": 0
}
```

### 1.3 Get Jobs List

`GET /api/jobs`

Query params:
- `sectionName`
- `sectionCanonicalUrl`
- `search`
- `active=true|false`
- `page`
- `limit`

Example:

```http
GET /api/jobs?sectionCanonicalUrl=latest-gov-jobs&page=1&limit=10&active=true
```

Success response:

```json
{
  "success": true,
  "total": 120,
  "page": 1,
  "limit": 10,
  "jobs": [
    {
      "id": "69be3737cc37885588cc10eb",
      "slug": "uptet-2026-up-teacher-eligibility-test",
      "sectionCanonicalUrl": "latest-gov-jobs",
      "sectionName": "Latest Gov Jobs",
      "jobtitle": "UPTET 2026: UP Teacher Eligibility Test",
      "title": "UPTET 2026: UP Teacher Eligibility Test",
      "status": "Online application window is currently open on the official portal.",
      "postType": "job"
    }
  ]
}
```

### 1.4 Get One Job by Slug or Id

`GET /api/jobs/get-post-details/:slug`

or

`GET /api/jobs?slug=uptet-2026-up-teacher-eligibility-test`

or

`GET /api/jobs?id=69be3737cc37885588cc10eb`

Success response:

```json
{
  "success": true,
  "job": {
    "id": "69be3737cc37885588cc10eb",
    "title": "UPTET 2026: UP Teacher Eligibility Test",
    "sectionName": "Latest Gov Jobs",
    "sectionCanonicalUrl": "latest-gov-jobs",
    "status": "Online application window is currently open on the official portal.",
    "important_dates": {
      "heading": "UPTET 2026 Important Dates",
      "dates": [
        {
          "event": "Online Application Starts",
          "date": "27 March 2026"
        }
      ]
    }
  }
}
```

Not found response:

```json
{
  "success": false,
  "message": "Job not found"
}
```

### 1.5 Update Job

`PATCH /api/jobs/:id`

Request JSON:

```json
{
  "status": "Online application window is currently open on the official portal.",
  "important_dates": {
    "heading": "Updated Important Dates",
    "dates": [
      {
        "event": "Last Date to Apply Online",
        "date": "01 May 2026"
      }
    ]
  }
}
```

Success response:

```json
{
  "success": true,
  "message": "Job updated successfully",
  "job": {
    "id": "69be3737cc37885588cc10eb",
    "status": "Online application window is currently open on the official portal."
  }
}
```

Note:
- Nested objects like `official_links`, `direct_links`, `important_dates`, `how_to_apply`, `introduction`, and `meta` are deep-merged during PATCH. Partial nested updates no longer wipe sibling keys.

### 1.6 Delete Job

`DELETE /api/jobs/:id`

Success response:

```json
{
  "success": true,
  "message": "Job deleted successfully",
  "job": {
    "id": "69be3737cc37885588cc10eb",
    "title": "UPTET 2026: UP Teacher Eligibility Test"
  }
}
```

### 1.7 Job Reminder

`GET /api/jobs/reminder?days=7&limit=20`

Success response:

```json
{
  "success": true,
  "days": 7,
  "total": 2,
  "jobs": [
    {
      "id": "69be3737cc37885588cc10eb",
      "postType": "job",
      "lifecycleStage": "application_open",
      "status": "Online application window is currently open on the official portal.",
      "slug": "uptet-2026-up-teacher-eligibility-test",
      "title": "UPTET 2026: UP Teacher Eligibility Test",
      "sectionName": "Latest Gov Jobs",
      "sectionCanonicalUrl": "latest-gov-jobs",
      "applyLastDate": "2026-04-25T18:30:00.000Z"
    }
  ]
}
```

### 1.8 Unified Search

`GET /api/jobs/search?q=uptet&limit=10`

Success response:

```json
{
  "success": true,
  "query": "uptet",
  "total": 3,
  "counts": {
    "jobs": 1,
    "blogs": 1,
    "schemes": 1
  },
  "results": [
    {
      "type": "job",
      "id": "69be3737cc37885588cc10eb",
      "title": "UPTET 2026: UP Teacher Eligibility Test",
      "slug": "uptet-2026-up-teacher-eligibility-test",
      "status": "Online application window is currently open on the official portal.",
      "sectionName": "Latest Gov Jobs",
      "sectionCanonicalUrl": "latest-gov-jobs",
      "date": "2026-04-25T18:30:00.000Z"
    }
  ]
}
```

---

## 2. Section APIs

### 2.1 Create or Upsert One Section

`POST /api/section`

Request JSON:

```json
{
  "name": "Latest Gov Jobs",
  "status": "active",
  "canonicalUrl": "latest-gov-jobs"
}
```

Success response:

```json
{
  "success": true,
  "message": "Section saved successfully",
  "section": {
    "id": "69be28cfcc37885588cc10c5",
    "name": "Latest Gov Jobs",
    "status": "active",
    "canonicalUrl": "latest-gov-jobs",
    "createdAt": "2026-03-21T05:12:46.909Z",
    "updatedAt": "2026-03-22T10:00:00.000Z"
  }
}
```

### 2.2 Bulk Upsert Sections

`POST /api/section`

Request JSON:

```json
[
  {
    "name": "Recent Admit Cards",
    "status": "active"
  },
  {
    "name": "Results",
    "status": "active"
  }
]
```

Success response:

```json
{
  "success": true,
  "message": "Sections synced successfully",
  "created": 1,
  "updated": 1,
  "total": 2,
  "sections": [
    {
      "id": "69be28cfcc37885588cc10c4",
      "name": "Recent Admit Cards",
      "status": "active",
      "canonicalUrl": "recent-admit-cards"
    }
  ]
}
```

### 2.3 Seed Default Sections

`POST /api/section/seed`

Success response:

```json
{
  "success": true,
  "message": "Default sections seeded successfully",
  "created": 0,
  "updated": 4,
  "total": 4,
  "sections": [
    {
      "name": "Latest Gov Jobs",
      "canonicalUrl": "latest-gov-jobs"
    }
  ]
}
```

### 2.4 Get Sections

`GET /api/section/get-all-sections`

Query params:
- `status`
- `search`
- `canonicalUrl`
- `id`

Success response:

```json
{
  "success": true,
  "total": 4,
  "sections": [
    {
      "id": "69be28cfcc37885588cc10c5",
      "name": "Latest Gov Jobs",
      "status": "active",
      "canonicalUrl": "latest-gov-jobs"
    }
  ]
}
```

### 2.5 Get Sections with Jobs

`GET /api/section/get-all-sections-with-jobs`

Query params:
- `status`
- `search`
- `section`
- `activeJobsOnly`
- `sectionLimit`
- `jobLimit`
- `jobPage`
- `jobSearch`

Success response:

```json
{
  "success": true,
  "total": 2,
  "filters": {
    "status": "active",
    "search": "",
    "section": "",
    "activeJobsOnly": "all",
    "sectionLimit": 20,
    "jobPage": 1,
    "jobLimit": 10,
    "jobSearch": ""
  },
  "sections": [
    {
      "id": "69be28cfcc37885588cc10c5",
      "name": "Latest Gov Jobs",
      "status": "active",
      "canonicalUrl": "latest-gov-jobs",
      "sectionName": "Latest Gov Jobs",
      "sectionCanonicalUrl": "latest-gov-jobs",
      "jobs": [
        {
          "status": "Online application window is currently open on the official portal.",
          "slug": "uptet-2026-up-teacher-eligibility-test",
          "title": "UPTET 2026: UP Teacher Eligibility Test",
          "applyLastDate": "2026-04-25T18:30:00.000Z"
        }
      ],
      "jobsPage": 1,
      "jobsLimit": 10,
      "jobsTotal": 1,
      "jobsTotalPages": 1,
      "jobsHasMore": false
    }
  ]
}
```

### 2.6 Update Section

`PATCH /api/section/:id`

Request JSON:

```json
{
  "name": "Latest Government Jobs",
  "status": "active",
  "canonicalUrl": "latest-gov-jobs"
}
```

Success response:

```json
{
  "success": true,
  "message": "Section updated successfully",
  "section": {
    "id": "69be28cfcc37885588cc10c5",
    "name": "Latest Government Jobs",
    "status": "active",
    "canonicalUrl": "latest-gov-jobs"
  }
}
```

### 2.7 Delete Section

`DELETE /api/section/:id`

Success response:

```json
{
  "success": true,
  "message": "Section deleted successfully",
  "section": {
    "id": "69be28cfcc37885588cc10c5",
    "name": "Latest Gov Jobs",
    "status": "active",
    "canonicalUrl": "latest-gov-jobs"
  }
}
```

---

## 3. Blog APIs

### 3.1 Create or Upsert One Blog

`POST /api/blog/add-blog`

Request JSON:

```json
{
  "slug": "how-to-check-result-safely",
  "title": "How To Check Result Safely",
  "excerpt": "Safe result checking guide.",
  "author": "SarkariAfsar",
  "category": "Career Guide",
  "tags": ["result", "guide"],
  "intro": "This guide explains how to verify result links safely.",
  "sections": [
    {
      "heading": "Step 1",
      "paragraphs": [
        "Open the official portal."
      ],
      "bullets": [
        "Check the domain",
        "Avoid fake mirrors"
      ]
    }
  ]
}
```

Success response:

```json
{
  "success": true,
  "message": "Blog synced successfully",
  "blogId": "69bf0000cc37885588cc1001"
}
```

### 3.2 Bulk Blog Sync

`POST /api/blog/add-blog`

Request JSON:

```json
[
  {
    "slug": "blog-a",
    "title": "Blog A",
    "excerpt": "Excerpt A",
    "author": "Admin",
    "category": "Guide",
    "intro": "Intro A"
  },
  {
    "slug": "blog-b",
    "title": "Blog B",
    "excerpt": "Excerpt B",
    "author": "Admin",
    "category": "Guide",
    "intro": "Intro B"
  }
]
```

Success response:

```json
{
  "success": true,
  "message": "Blogs synced successfully",
  "created": 1,
  "updated": 1,
  "matched": 2
}
```

### 3.3 Get All Blogs

`GET /api/blog/get-all-blogs`

Success response:

```json
{
  "success": true,
  "total": 120,
  "blogs": [
    {
      "_id": "69bf0000cc37885588cc1001",
      "slug": "how-to-check-result-safely",
      "title": "How To Check Result Safely"
    }
  ]
}
```

### 3.4 Get One Blog

`GET /api/blog/get-all-blogs/:slug`

Success response:

```json
{
  "success": true,
  "blog": {
    "_id": "69bf0000cc37885588cc1001",
    "slug": "how-to-check-result-safely",
    "title": "How To Check Result Safely",
    "excerpt": "Safe result checking guide."
  }
}
```

---

## 4. Government Scheme APIs

### 4.1 Create Scheme

`POST /api/gov-schemes`

Request JSON:

```json
{
  "schemeTitle": "Mukhyamantri Scholarship Yojana",
  "schemetype": "Scholarship",
  "state": "Uttar Pradesh",
  "city": "Lucknow",
  "requiredDocs": [
    "Aadhaar Card",
    "Income Certificate"
  ],
  "process": "Apply through the official portal and upload required documents.",
  "schemeStartDate": "2026-04-01",
  "schemeLastDate": "2026-06-30",
  "applyLink": "https://example.gov.in/scholarship",
  "aboutScheme": "State scholarship support for eligible students."
}
```

Success response:

```json
{
  "message": "Scheme created",
  "scheme": {
    "id": "69bf1111cc37885588cc1002",
    "schemeTitle": "Mukhyamantri Scholarship Yojana",
    "schemetype": "Scholarship",
    "state": "Uttar Pradesh",
    "city": "Lucknow"
  }
}
```

### 4.2 List Schemes

`GET /api/gov-schemes?page=1&limit=20&title=scholarship&state=Uttar Pradesh`

Success response:

```json
{
  "total": 25,
  "page": 1,
  "limit": 20,
  "schemes": [
    {
      "id": "69bf1111cc37885588cc1002",
      "schemeTitle": "Mukhyamantri Scholarship Yojana",
      "state": "Uttar Pradesh",
      "city": "Lucknow",
      "applyLink": "https://example.gov.in/scholarship/"
    }
  ]
}
```

### 4.3 Get One Scheme

`GET /api/gov-schemes/:id`

Success response:

```json
{
  "scheme": {
    "id": "69bf1111cc37885588cc1002",
    "schemeTitle": "Mukhyamantri Scholarship Yojana",
    "state": "Uttar Pradesh",
    "city": "Lucknow"
  }
}
```

Not found response:

```json
{
  "message": "Scheme not found",
  "scheme": null
}
```

### 4.4 Get All Schemes

`GET /api/gov-schemes/getAllSchemes`

Success response:

```json
{
  "total": 250,
  "schemes": [
    {
      "id": "69bf1111cc37885588cc1002",
      "schemeTitle": "Mukhyamantri Scholarship Yojana"
    }
  ]
}
```

### 4.5 Get State Names Only

`GET /api/gov-schemes/getSchemeStateNameOnly`

Success response:

```json
{
  "total": 5,
  "states": [
    "Bihar",
    "Delhi",
    "Uttar Pradesh"
  ]
}
```

### 4.6 Get Schemes by State

`GET /api/gov-schemes/getSchemeByState?state=Uttar Pradesh`

Success response:

```json
{
  "state": "Uttar Pradesh",
  "total": 10,
  "schemes": [
    {
      "id": "69bf1111cc37885588cc1002",
      "schemeTitle": "Mukhyamantri Scholarship Yojana"
    }
  ]
}
```

### 4.7 Update Scheme

`PATCH /api/gov-schemes/:id`

Request JSON:

```json
{
  "city": "Kanpur",
  "schemeLastDate": "2026-07-15",
  "aboutScheme": "Updated description for the scheme."
}
```

Success response:

```json
{
  "message": "Scheme updated",
  "scheme": {
    "id": "69bf1111cc37885588cc1002",
    "city": "Kanpur",
    "schemeLastDate": "2026-07-15T00:00:00.000Z"
  }
}
```

### 4.8 Seed Schemes from `scheme.md`

`POST /api/gov-schemes/seed`

Success response:

```json
{
  "message": "Gov schemes seeded from scheme.md",
  "total": 50,
  "created": 10,
  "updated": 35,
  "skipped": 5
}
```

---

## Quick Route Map

### Jobs
- `GET /api/jobs`
- `GET /api/jobs/get-post-details/:slug`
- `GET /api/jobs/reminder`
- `GET /api/jobs/search`
- `POST /api/jobs`
- `POST /api/jobs/add-job`
- `PATCH /api/jobs/:id`
- `DELETE /api/jobs/:id`

### Sections
- `GET /api/section/get-all-sections`
- `GET /api/section/get-all-sections-with-jobs`
- `POST /api/section`
- `POST /api/section/seed`
- `GET /api/section/:id`
- `PATCH /api/section/:id`
- `DELETE /api/section/:id`

### Blogs
- `GET /api/blog/get-all-blogs`
- `GET /api/blog/get-all-blogs/:slug`
- `POST /api/blog/add-blog`

### Gov Schemes
- `GET /api/gov-schemes`
- `POST /api/gov-schemes`
- `POST /api/gov-schemes/seed`
- `GET /api/gov-schemes/getAllSchemes`
- `GET /api/gov-schemes/getSchemeStateNameOnly`
- `GET /api/gov-schemes/getSchemeByState`
- `GET /api/gov-schemes/:id`
- `PATCH /api/gov-schemes/:id`
