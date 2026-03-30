# Admin Panel API Reference

This document lists all API endpoints discovered in the repository, with request/response payload examples and short descriptions — use this to build the admin panel.

Note: routes shown are relative to the API root where `routes/index.js` is mounted (e.g. `/post`, `/blog`, `/schemes`, ...).

---

## Common notes
- Most create/update endpoints expect the request body under `data`. Example: `{ "data": { ... } }`.
- Bulk create is supported by passing an array: `{ "data": [ {...}, {...} ] }`.
- Successful responses usually follow the shape: `{ success: true, message: "...", data: ... }`.
- Validation errors return `400`, duplicates `409`, not found `404`, server errors `500`.

---

## Root

### GET /
- Purpose: Health / quick check
- Request: none
- Response example:

```json
{ "message": "API is working" }
```

---

## Post (job posts)

Base route: `/post`

### POST /post/add
- Purpose: Create a job post or bulk create many posts.
- Request examples (single):

```json
{
  "data": {
    "title": "Assistant Engineer Recruitment 2026",
    "slug": "assistant-engineer-recruitment-2026", // optional, auto-generated from title if missing
    "jobtitle": "Assistant Engineer",
    "category": "Engineering",
    "sectionName": "Recruitments",
    "sectionCanonicalUrl": "recruitments",
    "tags": ["engineering","govt"],
    "applyLastDate": "2026-05-31T00:00:00.000Z"
  }
}
```

Bulk example:

```json
{ "data": [ { /* post1 */ }, { /* post2 */ } ] }
```

- Key validations: `title` required; `slug` or `title` required (slug will be generated from title if missing). `tags` must be an array of strings. `applyLastDate` parsed as Date.
- Success response example (single created):

```json
{
  "success": true,
  "message": "Job post created",
  "data": { "_id": "...", "title": "...", "slug": "...", "createdAt": "...", ... }
}
```

### GET /post/
- Purpose: List job posts (supports filters + pagination)
- Query params: `page`, `limit`, `category`, `status`, `language`, `tag`, `search`, `sortBy`, `order`
- Response example:

```json
{
  "success": true,
  "message": "Job posts fetched",
  "data": [ /* array of job post objects */ ],
  "pagination": { "total": 123, "page": 1, "limit": 10, "totalPages": 13 }
}
```

### GET /post/id/:id
- Purpose: Get single post by MongoDB `_id`
- Response:

```json
{ "success": true, "data": { "_id": "...", "title": "...", "slug": "...", ... } }
```

### GET /post/slug/:slug
- Purpose: Get single post by slug

### GET /post/dedupe/:dedupeKey
- Purpose: Get single post by `dedupeKey`

### GET /post/get-deadline-jobs
- Purpose: Find posts with approaching `applyLastDate` (reminder)
- Query params: `days` (required, integer), `page`, `limit`, `category`, `sectionCanonicalUrl`
- Response: includes `data`, `reminder` and `pagination` fields.

### GET /post/get-posts-with-section
- Purpose: Return sections with their posts (aggregated)
- Query params: `sectionCanonicalUrl` (optional), `sortBy`, `order`
- Response example:

```json
{
  "success": true,
  "message": "Sections with posts",
  "data": [
    {
      "sectionName": "Recruitments",
      "sectionCanonicalUrl": "recruitments",
      "posts": [{ "title": "...", "slug": "..." }, ...]
    }
  ]
}
```

### GET /post/section-list/:sectionCanonicalUrl
- Purpose: List posts for a section (supports pagination and search)
- Query params: `page`, `limit`, `search`, `order`

### PUT /post/id/:id  or  PUT /post/slug/:slug
- Purpose: Update post by id or slug
- Request body: `{ "data": { /* fields to update */ } }`
- Response: `{ success: true, message: "Updated", data: { /* updated doc */ } }`

### DELETE /post/id/:id  or  DELETE /post/slug/:slug
- Purpose: Delete post by id or slug
- Response: `{ success: true, message: "Deleted", data: { /* deleted doc */ } }`

Model fields (common; see `models/post.js`): `title`, `slug`, `jobtitle`, `dedupeKey`, `sourceUrl`, `sectionName`, `sectionCanonicalUrl`, `category`, `language`, `advertisement_number`, `advertisementNumber`, `conducting_authority`, `conductingAuthority`, `disclaimer`, `tags` (array), `status`, `applyLastDate` (date), `isActive` (bool), `scrapedMeta`, `scrapedContent`.

---

## Post Sections

Base route: `/postsection`

### POST /postsection/add
- Purpose: Create section(s)
- Request: `{ "data": { "name": "Section Name", "status": "active" } }` or array
- Required: `name`
- Success: `201` with created doc(s)

### GET /postsection/
- Purpose: List job sections
- Query: `page`, `limit`, `status`, `search`, `sortBy`, `order`
- Response: `{ success: true, data: [ ... ], pagination: { ... } }`

### GET /postsection/id/:id
### GET /postsection/canonical/:canonicalUrl
### PUT /postsection/id/:id
### PUT /postsection/canonical/:canonicalUrl
### DELETE /postsection/id/:id
### DELETE /postsection/canonical/:canonicalUrl

Notes: `canonicalUrl` is auto-generated from `name` when missing. `status` allowed values: `active`, `inactive`.

---

## Blog

Base route: `/blog`

### POST /blog/add
- Purpose: Create blog(s)
- Request example (single):

```json
{
  "data": {
    "slug": "my-blog-slug", // required (or will be generated from title in some cases)
    "title": "Blog Title",
    "excerpt": "Short excerpt",
    "author": "Author Name",
    "category": "Category",
    "intro": "Introduction text",
    "sections": [{ "heading": "H1", "paragraphs": ["p1"], "bullets": ["b1"] }]
  }
}
```

- Required fields (controller validation): `slug`, `title`, `excerpt`, `author`, `category`, `intro`.
- Success: `201` with created blog(s).

### GET /blog/
- Purpose: List blogs
- Query params: `page`, `limit`, `category`, `author`, `tag`, `search`, `sortBy`, `order`

### GET /blog/id/:id
### GET /blog/slug/:slug
### PUT /blog/id/:id
### PUT /blog/slug/:slug
### DELETE /blog/id/:id
### DELETE /blog/slug/:slug

Response example (list): same pattern with `success/message/data/pagination`.

---

## Schemes (gov schemes)

Base route: `/schemes`

### POST /schemes/add
- Purpose: Create scheme(s)
- Request body example:

```json
{
  "data": {
    "schemeTitle": "Food Subsidy Scheme",
    "schemetype": "Subsidy",
    "requiredDocs": ["ID","Address proof"],
    "process": "Apply online",
    "state": "Bihar",
    "city": "Patna",
    "schemeStartDate": "2026-04-01",
    "schemeLastDate": "2026-10-01",
    "applyLink": "https://example.gov/apply",
    "aboutScheme": "Details..."
  }
}
```

- Key validation: `schemeTitle` is required. `requiredDocs` must be array when present.
- Success: `201` with created doc(s).

### GET /schemes/
- Purpose: List schemes with filters
- Query params: `page`, `limit`, `state`, `city`, `schemetype`, `search`, `sortBy`, `order`, `upcoming`, `expired`

### GET /schemes/getSchemeStateNameOnly
- Purpose: Return unique state names for schemes
- Response example:

```json
{ "success": true, "message": "Scheme states fetched successfully", "data": ["Bihar", "Jharkhand"] }
```

### GET /schemes/getSchemeByState
- Purpose: Schemes filtered by `state` (supports pagination etc.)

### GET /schemes/slug/:slug  and  GET /schemes/:id
### PUT /schemes/:id
### DELETE /schemes/:id

---

## Search

Base route: `/search`

### GET /search/search-with-title?title=...
- Purpose: Quick title search across blogs, schemes and posts
- Query param: `title` (required, at least 3 characters)
- Response example:

```json
{
  "success": true,
  "message": "Search results fetched successfully",
  "data": [ { "title": "...", "type": "blog|post|scheme", "slug": "..." }, ... ]
}
```

---

## Stats

Base route: `/stats`

### GET /stats/schemes
- Returns: `{ count: <number> }`

### GET /stats/blogs
- Returns: `{ count: <number> }`

### GET /stats/posts
- Returns: `{ count: <number> }`

### GET /stats/posts/advanced
- Purpose: Aggregated stats for posts (group by organization)
- Response example:

```json
{
  "total": 1234,
  "byOrganization": [ { "organization": "UPSSSC", "count": 200 }, { "organization": "Other", "count": 1034 } ]
}
```

---

## Scrapper (cron)

Base route: `/scrapper`

### POST /scrapper/run-section-cron
- Purpose: Trigger section scraping cron (used by scrapper utilities)
- Request: none
- Response example:

```json
{
  "success": true,
  "message": "Section scrape cron executed successfully",
  "data": { /* summary object returned by runSectionScrapeCycle() */ }
}
```

---

## Error shapes & status codes (summary)
- 200: OK (successful read/update/delete)
- 201: Created (successful create)
- 400: Validation / bad input (controller returns `message`)
- 404: Not found
- 409: Duplicate key (unique constraint)
- 500: Server error

---

If you want, I can:
- Add example UI forms (fields) for each endpoint to speed up admin panel development.
- Generate a compact JSON OpenAPI (Swagger) spec from this repository.

File generated from `routes/` and `controllers/` sources in the project. Verify any mount prefix you use in your Express app when wiring up these routes.

---

## NEW: Backend Changes Summary (SEO + CMS + Performance)

### 1. Dynamic JobPosting JSON-LD Schema

#### GET /post/jsonld/:slug
- **Kaam kya karta hai:** Kisi bhi job post ka Google-compatible JSON-LD (JobPosting structured data) dynamically generate karta hai. Frontend me `<script type="application/ld+json">` tag me embed karna hai.
- Response example:

```json
{
  "success": true,
  "data": {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    "title": "Assistant Engineer Recruitment 2026",
    "description": "Assistant Engineer Recruitment 2026. Job Title: Assistant Engineer. Category: Engineering. Salary: 44900-142400. Selection Process: Written Exam + Interview",
    "datePosted": "2026-03-15T00:00:00.000Z",
    "validThrough": "2026-05-31T00:00:00.000Z",
    "hiringOrganization": { "@type": "Organization", "name": "UPPSC" },
    "jobLocation": { "@type": "Place", "address": { "@type": "PostalAddress", "addressCountry": "IN", "addressLocality": "Uttar Pradesh" } },
    "baseSalary": { "@type": "MonetaryAmount", "currency": "INR", "value": { "@type": "QuantitativeValue", "value": "44900-142400", "unitText": "MONTH" } },
    "url": "https://sarkariafsar.com/post/assistant-engineer-recruitment-2026",
    "identifier": { "@type": "PropertyValue", "name": "Advertisement Number", "value": "A-1/E-1/2026" },
    "employmentType": "FULL_TIME"
  },
  "noIndex": false
}
```

- **Utility file:** `utils/generateJobPostingLD.js` — data dynamically har post se fetech hota hai (title, location, salary, org, last date).
- **Frontend usage (Next.js example):**

```jsx
<Head>
  <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }} />
</Head>
```

---

### 2. Custom Content Fields (1000+ Words SEO Content)

Job Post model me naye fields add hue hain — admin panel se in fields me detailed content likhna hai taaki word count 1000+ ho aur "Low Value Content" penalty na aaye:

| Field | Type | Purpose |
|---|---|---|
| `examPreparationStrategy` | text/textarea | Exam ki taiyari kaise karein — detailed strategy |
| `syllabusBreakdown` | text/textarea | Complete syllabus detail section wise |
| `physicalTestDetails` | text/textarea | Physical test ki poori detail (PET/PST) |
| `selectionProcess` | text/textarea | Selection process step by step |
| `ageLimit` | text | Age limit details |
| `applicationFee` | text | Category-wise application fee |
| `salary` | text | Salary / pay scale (JSON-LD me bhi jaata hai) |
| `location` | text | Job location (JSON-LD me bhi jaata hai) |
| `totalVacancies` | text | Total vacancies |
| `wordCount` | number | **Auto-calculated** — server khud count karta hai |

**Admin panel tip:** In fields ko "SEO Content" tab me rakhein, aur ek word-count indicator dikhayein (green ≥ 1000, yellow 300–999, red < 300).

---

### 3. Author & Source Management (YMYL Fix)

#### Job Post & Blog — Author Profile Fields

| Field | Type | Purpose |
|---|---|---|
| `authorName` | text | Author ka naam |
| `authorProfileUrl` | url | Author profile page ka link |
| `authorBio` | text | Author ka short bio / credentials |
| `authorCredentials` | text | (Blog only) Author ki qualifications |

#### Scheme — Mandatory Official Source

| Field | Type | Validation |
|---|---|---|
| `officialSourceUrl` | url | **REQUIRED** — Sirf `.gov.in` ya `.nic.in` link accept hoga |
| `authorName` | text | Author ka naam |
| `authorProfileUrl` | url | Author profile link |
| `authorBio` | text | Author bio |

**Create scheme pe validation:**
```
officialSourceUrl is required (must be a .gov.in or .nic.in link)
```

Agar galat URL diya to:
```
officialSourceUrl must be an official .gov.in or .nic.in link
```

---

### 4. Auto "No-Index" Logic (Thin Content Protection)

- **Utility:** `utils/thinContentCheck.js`
- **Threshold:** 300 words se kam = thin content → `noIndex: true`
- **Kaise kaam karta hai:**
  - Jab bhi post create ya update hota hai, server automatically sare text fields (title, jobtitle, examPreparationStrategy, syllabusBreakdown, etc.) + scraped HTML ka word count karta hai.
  - `wordCount` field me store hota hai.
  - Agar `wordCount < 300` → `noIndex = true` set hota hai.
- **Frontend me kaise use karein:**

#### GET /post/meta/:slug
- Purpose: Frontend ko batata hai ki page ko noindex karna hai ya nahi.
- Response:

```json
{ "success": true, "data": { "slug": "some-post", "noIndex": true, "wordCount": 150 } }
```

- **Frontend integration (Next.js):**

```jsx
{postMeta.noIndex && (
  <meta name="robots" content="noindex, nofollow" />
)}
```

---

### 5. Redis Caching (TTFB Optimization)

- **Utility:** `utils/cache.js`
- **Dependency:** `ioredis` (already installed in package.json)
- **Environment variable:** `REDIS_URL` (default: `redis://127.0.0.1:6379`)
- **Graceful fallback:** Agar Redis nahi chal raha to server normally kaam karega — sirf cache nahi hoga.

**Cached endpoints aur TTL:**

| Endpoint | Cache TTL |
|---|---|
| `GET /post/` | 60 sec |
| `GET /post/id/:id`, `/slug/:slug` | 120 sec |
| `GET /post/get-deadline-jobs` | 300 sec |
| `GET /post/get-posts-with-section` | 120 sec |
| `GET /post/jsonld/:slug` | 600 sec |
| `GET /post/meta/:slug` | 600 sec |
| `GET /blog/`, `/blog/id/:id`, `/blog/slug/:slug` | 60-120 sec |
| `GET /schemes/`, `/schemes/:id`, `/schemes/slug/:slug` | 60-120 sec |
| `GET /schemes/getSchemeStateNameOnly` | 300 sec |
| `GET /stats/*` | 120-300 sec |

**Admin Cache Management endpoints:**

#### POST /cache/flush
- Purpose: Poora cache clear karna (jab major update ho)
- Request: none
- Response: `{ "success": true, "message": "Cache flushed" }`

#### POST /cache/flush-pattern
- Purpose: Specific pattern ka cache clear karna
- Request body: `{ "pattern": "cache:/api/post*" }`
- Response: `{ "success": true, "message": "Flushed 15 keys matching cache:/api/post*" }`

**Admin panel tip:** "Clear Cache" button daalein jo `/cache/flush` call kare result update ya major content change ke baad.

---

### Redis Setup (production)

```bash
# Ubuntu/Debian
sudo apt install redis-server
sudo systemctl enable redis-server

# .env file me add karein
REDIS_URL=redis://127.0.0.1:6379
```

---

---

## Admin UI Forms (for building admin panel)

### Job Post — Create / Edit form
- title (text) — required
- slug (text) — optional; auto-generated from `title` if blank
- jobtitle (text)
- category (text)
- sectionName (text)
- sectionCanonicalUrl (text)
- tags (multi-select / comma-separated)
- advertisement_number / advertisementNumber (text)
- conducting_authority / conductingAuthority (text)
- applyLastDate (date)
- status (text)
- isActive (checkbox)
- sourceUrl (url)
- **salary** (text) — NEW
- **location** (text) — NEW
- **totalVacancies** (text) — NEW
- **ageLimit** (text) — NEW
- **applicationFee** (text) — NEW
- **selectionProcess** (textarea) — NEW — Selection process detail
- **examPreparationStrategy** (textarea) — NEW — Exam prep strategy (SEO content)
- **syllabusBreakdown** (textarea) — NEW — Syllabus detail (SEO content)
- **physicalTestDetails** (textarea) — NEW — PET/PST details (SEO content)
- **authorName** (text) — NEW — YMYL author name
- **authorProfileUrl** (url) — NEW — Author profile link
- **authorBio** (textarea) — NEW — Author bio
- wordCount (readonly number) — Auto-calculated by server
- noIndex (readonly checkbox) — Auto-set by server (true = thin content)
- scrapedContent.contentHtml (textarea)
- scrapedMeta.sourceSiteName (text)
- Notes: send body as `{ "data": { ... } }`. For bulk create send `{ "data": [ {...}, {...} ] }`.

### Post Section — Create / Edit form
- name (text) — required
- canonicalUrl (text) — optional; auto-generated from `name`
- status (select) — `active|inactive`
- aliases (multi)
- sourceSectionName (text)
- sourceSectionUrl (url)
- Notes: send body as `{ "data": { ... } }` or array for bulk.

### Blog — Create / Edit form
- slug (text) — required
- title (text) — required
- excerpt (textarea) — required
- intro (textarea) — required
- author (text) — required
- category (text) — required
- tags (multi)
- publishedAt (date)
- sections (repeating block): heading (text), paragraphs (multi), bullets (multi)
- **authorProfileUrl** (url) — NEW — Author profile link
- **authorBio** (textarea) — NEW — Author bio
- **authorCredentials** (text) — NEW — Author qualifications
- wordCount (readonly) — Auto
- noIndex (readonly) — Auto

### Scheme — Create / Edit form
- schemeTitle (text) — required
- schemetype (text)
- requiredDocs (multi)
- process (textarea)
- state (text)
- city (text)
- schemeStartDate (date)
- schemeLastDate (date)
- applyLink (url)
- aboutScheme (textarea)
- **officialSourceUrl** (url) — NEW — **REQUIRED** — Must be `.gov.in` or `.nic.in` link
- **authorName** (text) — NEW
- **authorProfileUrl** (url) — NEW
- **authorBio** (textarea) — NEW
- wordCount (readonly) — Auto
- noIndex (readonly) — Auto

### Search / Stats / Scrapper / Cache (admin controls)
- Search: single input `title` (min 3 chars) → GET `/search/search-with-title?title=...`
- Stats: simple counters endpoints (`/stats/schemes`, `/stats/blogs`, `/stats/posts`) — show counts.
- Scrapper Cron: single button triggers POST `/scrapper/run-section-cron` and shows `data` summary in response.
- **Cache Flush:** button → POST `/cache/flush` — NEW
- **Cache Flush Pattern:** input `pattern` + button → POST `/cache/flush-pattern` — NEW

---

## Compact OpenAPI (JSON) spec (v3) — paste into Swagger / Postman

```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "Admin API",
    "version": "2.0.0",
    "description": "Compact OpenAPI spec — covers all endpoints including SEO, YMYL, caching"
  },
  "servers": [
    { "url": "http://localhost:5000/api", "description": "Local" }
  ],
  "paths": {
    "/post/add": {
      "post": {
        "summary": "Create job post(s)",
        "tags": ["Post"],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": { "type": "object", "properties": { "data": { "oneOf": [ { "$ref": "#/components/schemas/JobPost" }, { "type": "array", "items": { "$ref": "#/components/schemas/JobPost" } } ] } } }
            }
          }
        },
        "responses": { "201": { "description": "Created" }, "400": { "description": "Validation error" } }
      }
    },
    "/post": {
      "get": {
        "summary": "List job posts (paginated, cached 60s)",
        "tags": ["Post"],
        "parameters": [
          { "name": "page", "in": "query", "schema": { "type": "integer" } },
          { "name": "limit", "in": "query", "schema": { "type": "integer" } },
          { "name": "category", "in": "query", "schema": { "type": "string" } },
          { "name": "status", "in": "query", "schema": { "type": "string" } },
          { "name": "language", "in": "query", "schema": { "type": "string" } },
          { "name": "tag", "in": "query", "schema": { "type": "string" } },
          { "name": "search", "in": "query", "schema": { "type": "string" } },
          { "name": "sortBy", "in": "query", "schema": { "type": "string" } },
          { "name": "order", "in": "query", "schema": { "type": "string", "enum": ["asc", "desc"] } }
        ],
        "responses": { "200": { "description": "OK", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/PaginatedResponse" } } } } }
      }
    },
    "/post/id/{id}": {
      "get": { "summary": "Get post by id (cached 120s)", "tags": ["Post"], "parameters": [ { "name": "id", "in": "path", "required": true, "schema": { "type": "string" } } ], "responses": { "200": { "description": "OK" }, "404": { "description": "Not found" } } },
      "put": { "summary": "Update post by id", "tags": ["Post"], "parameters": [ { "name": "id", "in": "path", "required": true, "schema": { "type": "string" } } ], "requestBody": { "required": true, "content": { "application/json": { "schema": { "type": "object", "properties": { "data": { "$ref": "#/components/schemas/JobPost" } } } } } }, "responses": { "200": { "description": "Updated" } } },
      "delete": { "summary": "Delete post by id", "tags": ["Post"], "parameters": [ { "name": "id", "in": "path", "required": true, "schema": { "type": "string" } } ], "responses": { "200": { "description": "Deleted" } } }
    },
    "/post/slug/{slug}": {
      "get": { "summary": "Get post by slug (cached 120s)", "tags": ["Post"], "parameters": [ { "name": "slug", "in": "path", "required": true, "schema": { "type": "string" } } ], "responses": { "200": { "description": "OK" } } },
      "put": { "summary": "Update post by slug", "tags": ["Post"], "parameters": [ { "name": "slug", "in": "path", "required": true, "schema": { "type": "string" } } ], "requestBody": { "required": true, "content": { "application/json": { "schema": { "type": "object", "properties": { "data": { "$ref": "#/components/schemas/JobPost" } } } } } }, "responses": { "200": { "description": "Updated" } } },
      "delete": { "summary": "Delete post by slug", "tags": ["Post"], "parameters": [ { "name": "slug", "in": "path", "required": true, "schema": { "type": "string" } } ], "responses": { "200": { "description": "Deleted" } } }
    },
    "/post/jsonld/{slug}": {
      "get": {
        "summary": "Get JSON-LD structured data for a post (cached 600s)",
        "tags": ["SEO"],
        "parameters": [ { "name": "slug", "in": "path", "required": true, "schema": { "type": "string" } } ],
        "responses": { "200": { "description": "JSON-LD + noIndex flag" } }
      }
    },
    "/post/meta/{slug}": {
      "get": {
        "summary": "Get noIndex/wordCount meta for a post (cached 600s)",
        "tags": ["SEO"],
        "parameters": [ { "name": "slug", "in": "path", "required": true, "schema": { "type": "string" } } ],
        "responses": { "200": { "description": "Meta data" } }
      }
    },
    "/post/get-deadline-jobs": {
      "get": { "summary": "Expiring posts reminder (cached 300s)", "tags": ["Post"], "parameters": [ { "name": "days", "in": "query", "required": true, "schema": { "type": "integer" } }, { "name": "page", "in": "query", "schema": { "type": "integer" } }, { "name": "limit", "in": "query", "schema": { "type": "integer" } } ], "responses": { "200": { "description": "OK" } } }
    },
    "/post/get-posts-with-section": {
      "get": { "summary": "Sections with posts (cached 120s)", "tags": ["Post"], "responses": { "200": { "description": "OK" } } }
    },
    "/post/section-list/{sectionCanonicalUrl}": {
      "get": { "summary": "Posts in a section (cached 120s)", "tags": ["Post"], "parameters": [ { "name": "sectionCanonicalUrl", "in": "path", "required": true, "schema": { "type": "string" } } ], "responses": { "200": { "description": "OK" } } }
    },
    "/blog/add": {
      "post": { "summary": "Create blog(s)", "tags": ["Blog"], "requestBody": { "required": true, "content": { "application/json": { "schema": { "type": "object", "properties": { "data": { "oneOf": [ { "$ref": "#/components/schemas/Blog" }, { "type": "array", "items": { "$ref": "#/components/schemas/Blog" } } ] } } } } } }, "responses": { "201": { "description": "Created" } } }
    },
    "/blog": {
      "get": { "summary": "List blogs (cached 60s)", "tags": ["Blog"], "parameters": [ { "name": "page", "in": "query", "schema": { "type": "integer" } }, { "name": "limit", "in": "query", "schema": { "type": "integer" } }, { "name": "category", "in": "query", "schema": { "type": "string" } }, { "name": "author", "in": "query", "schema": { "type": "string" } }, { "name": "search", "in": "query", "schema": { "type": "string" } } ], "responses": { "200": { "description": "OK" } } }
    },
    "/schemes/add": {
      "post": { "summary": "Create scheme(s) — requires officialSourceUrl (.gov.in/.nic.in)", "tags": ["Scheme"], "requestBody": { "required": true, "content": { "application/json": { "schema": { "type": "object", "properties": { "data": { "oneOf": [ { "$ref": "#/components/schemas/Scheme" }, { "type": "array", "items": { "$ref": "#/components/schemas/Scheme" } } ] } } } } } }, "responses": { "201": { "description": "Created" }, "400": { "description": "Validation error (missing/invalid officialSourceUrl)" } } }
    },
    "/schemes": {
      "get": { "summary": "List schemes (cached 60s)", "tags": ["Scheme"], "parameters": [ { "name": "page", "in": "query", "schema": { "type": "integer" } }, { "name": "limit", "in": "query", "schema": { "type": "integer" } }, { "name": "state", "in": "query", "schema": { "type": "string" } }, { "name": "city", "in": "query", "schema": { "type": "string" } }, { "name": "schemetype", "in": "query", "schema": { "type": "string" } }, { "name": "search", "in": "query", "schema": { "type": "string" } }, { "name": "upcoming", "in": "query", "schema": { "type": "string" } }, { "name": "expired", "in": "query", "schema": { "type": "string" } } ], "responses": { "200": { "description": "OK" } } }
    },
    "/search/search-with-title": {
      "get": { "summary": "Search across blogs/schemes/posts", "tags": ["Search"], "parameters": [ { "name": "title", "in": "query", "required": true, "schema": { "type": "string" } } ], "responses": { "200": { "description": "Results" } } }
    },
    "/stats/schemes": { "get": { "summary": "Schemes count (cached 120s)", "tags": ["Stats"], "responses": { "200": { "description": "count" } } } },
    "/stats/blogs": { "get": { "summary": "Blogs count (cached 120s)", "tags": ["Stats"], "responses": { "200": { "description": "count" } } } },
    "/stats/posts": { "get": { "summary": "Posts count (cached 120s)", "tags": ["Stats"], "responses": { "200": { "description": "count" } } } },
    "/stats/posts/advanced": { "get": { "summary": "Posts by org stats (cached 300s)", "tags": ["Stats"], "responses": { "200": { "description": "Stats" } } } },
    "/scrapper/run-section-cron": { "post": { "summary": "Run section scrape cron", "tags": ["Scrapper"], "responses": { "200": { "description": "Summary" } } } },
    "/cache/flush": { "post": { "summary": "Flush entire Redis cache", "tags": ["Cache"], "responses": { "200": { "description": "Cache flushed" } } } },
    "/cache/flush-pattern": { "post": { "summary": "Flush cache keys by pattern", "tags": ["Cache"], "requestBody": { "required": true, "content": { "application/json": { "schema": { "type": "object", "properties": { "pattern": { "type": "string", "example": "cache:/api/post*" } }, "required": ["pattern"] } } } }, "responses": { "200": { "description": "Keys flushed" } } } }
  },
  "components": {
    "schemas": {
      "JobPost": {
        "type": "object",
        "properties": {
          "title": { "type": "string" },
          "slug": { "type": "string" },
          "jobtitle": { "type": "string" },
          "category": { "type": "string" },
          "sectionName": { "type": "string" },
          "sectionCanonicalUrl": { "type": "string" },
          "tags": { "type": "array", "items": { "type": "string" } },
          "applyLastDate": { "type": "string", "format": "date-time" },
          "status": { "type": "string" },
          "isActive": { "type": "boolean" },
          "sourceUrl": { "type": "string", "format": "uri" },
          "salary": { "type": "string" },
          "location": { "type": "string" },
          "totalVacancies": { "type": "string" },
          "ageLimit": { "type": "string" },
          "applicationFee": { "type": "string" },
          "selectionProcess": { "type": "string" },
          "examPreparationStrategy": { "type": "string" },
          "syllabusBreakdown": { "type": "string" },
          "physicalTestDetails": { "type": "string" },
          "authorName": { "type": "string" },
          "authorProfileUrl": { "type": "string", "format": "uri" },
          "authorBio": { "type": "string" },
          "wordCount": { "type": "integer", "readOnly": true },
          "noIndex": { "type": "boolean", "readOnly": true }
        },
        "required": ["title"]
      },
      "Blog": {
        "type": "object",
        "properties": {
          "slug": { "type": "string" },
          "title": { "type": "string" },
          "excerpt": { "type": "string" },
          "author": { "type": "string" },
          "category": { "type": "string" },
          "intro": { "type": "string" },
          "sections": { "type": "array", "items": { "type": "object", "properties": { "heading": { "type": "string" }, "paragraphs": { "type": "array", "items": { "type": "string" } }, "bullets": { "type": "array", "items": { "type": "string" } } } } },
          "authorProfileUrl": { "type": "string", "format": "uri" },
          "authorBio": { "type": "string" },
          "authorCredentials": { "type": "string" },
          "wordCount": { "type": "integer", "readOnly": true },
          "noIndex": { "type": "boolean", "readOnly": true }
        },
        "required": ["slug", "title", "excerpt", "author", "category", "intro"]
      },
      "Scheme": {
        "type": "object",
        "properties": {
          "schemeTitle": { "type": "string" },
          "schemetype": { "type": "string" },
          "requiredDocs": { "type": "array", "items": { "type": "string" } },
          "process": { "type": "string" },
          "state": { "type": "string" },
          "city": { "type": "string" },
          "schemeStartDate": { "type": "string", "format": "date" },
          "schemeLastDate": { "type": "string", "format": "date" },
          "applyLink": { "type": "string", "format": "uri" },
          "aboutScheme": { "type": "string" },
          "officialSourceUrl": { "type": "string", "format": "uri", "description": "REQUIRED — must be .gov.in or .nic.in" },
          "authorName": { "type": "string" },
          "authorProfileUrl": { "type": "string", "format": "uri" },
          "authorBio": { "type": "string" },
          "wordCount": { "type": "integer", "readOnly": true },
          "noIndex": { "type": "boolean", "readOnly": true }
        },
        "required": ["schemeTitle", "officialSourceUrl"]
      },
      "JobSection": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "canonicalUrl": { "type": "string" },
          "status": { "type": "string", "enum": ["active", "inactive"] },
          "aliases": { "type": "array", "items": { "type": "string" } }
        },
        "required": ["name"]
      },
      "StandardResponse": {
        "type": "object",
        "properties": { "success": { "type": "boolean" }, "message": { "type": "string" }, "data": {} }
      },
      "PaginatedResponse": {
        "type": "object",
        "properties": {
          "success": { "type": "boolean" },
          "message": { "type": "string" },
          "data": { "type": "array", "items": {} },
          "pagination": { "type": "object", "properties": { "total": { "type": "integer" }, "page": { "type": "integer" }, "limit": { "type": "integer" }, "totalPages": { "type": "integer" } } }
        }
      }
    }
  }
}
```
 