# Admin Panel API Reference

**Last updated:** April 2026
**Base API URL (prod):** `https://sarkariafsar.com/api`
**Base API URL (dev):**  `http://localhost:5000/api`
**Auth header:** `Authorization: Bearer <JWT>`

---

## GLOBAL CONVENTIONS

### Request wrapper
Most POST/PUT create-or-update endpoints expect body wrapped in `data`:
```json
{ "data": { "field": "value" } }
```
Bulk create — pass array:
```json
{ "data": [ { "field": "value" }, { "field": "value" } ] }
```

### Standard success response
```json
{ "success": true, "message": "...", "data": { } }
```

### Paginated response
```json
{
  "success": true,
  "data": [ ],
  "pagination": { "total": 120, "page": 1, "limit": 20, "totalPages": 6 }
}
```

### Error responses
| Code | Meaning |
|------|---------|
| 400 | Validation failed / missing required field |
| 401 | Missing or invalid JWT |
| 404 | Resource not found |
| 409 | Duplicate (slug, dedupeKey, etc.) |
| 422 | Unprocessable (e.g. scanned PDF) |
| 500 | Internal server error |

---

## 1. AUTHENTICATION — `/api/auth`

No body needed. Google OAuth 2.0 flow. JWT expires in **30 days**.

### GET `/api/auth/google`
Redirect browser here to start login. No request body.
```
Browser → GET /api/auth/google → (Passport redirects) → Google consent screen
```

### GET `/api/auth/google/callback`
Google redirects here after user consents. Handled by Passport + controller.
On success → redirects browser to:
```
{FRONTEND_URL}/auth/callback?token=eyJhbGc...
```
On failure → redirects to:
```
{FRONTEND_URL}/auth/callback?error=server_error
```
Frontend stores JWT in `localStorage` under key `sa_token`.

### GET `/api/auth/me` — 🔒 Auth required
Returns currently authenticated user.

**Request:**
```
GET /api/auth/me
Authorization: Bearer eyJhbGc...
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "_id": "663abc123def456",
    "googleId": "116...",
    "name": "Ankit Verma",
    "email": "user@gmail.com",
    "avatar": "https://lh3.googleusercontent.com/...",
    "role": "user",
    "savedJobs": [
      { "postId": "...", "slug": "ssc-cgl-2026", "title": "SSC CGL 2026", "savedAt": "2026-04-12T..." }
    ],
    "mockTestHistory": [
      { "testId": "...", "testTitle": "SSC CGL Mock 1", "score": 18, "totalQ": 25, "timeTakenSec": 1200, "takenAt": "2026-04-10T..." }
    ],
    "lastLoginAt": "2026-04-12T10:00:00.000Z",
    "createdAt": "2026-03-01T...",
    "updatedAt": "2026-04-12T..."
  }
}
```

**Response 401:**
```json
{ "success": false, "message": "Authentication required" }
```

---

## 2. USER — `/api/user`

All routes require JWT.

---

### GET `/api/user/profile` — 🔒
Full user profile (same shape as `/auth/me` response).

**Response 200:**
```json
{
  "success": true,
  "data": {
    "_id": "663abc...", "name": "Ankit Verma", "email": "user@gmail.com",
    "avatar": "https://...", "role": "user",
    "savedJobs": [ ... ], "mockTestHistory": [ ... ],
    "lastLoginAt": "...", "createdAt": "...", "updatedAt": "..."
  }
}
```

---

### GET `/api/user/saved` — 🔒
List user's saved job posts.

**Response 200:**
```json
{
  "success": true,
  "data": [
    { "postId": "663def...", "slug": "upsc-cse-2026", "title": "UPSC CSE 2026", "savedAt": "2026-04-12T..." },
    { "postId": "663ghi...", "slug": "ssc-cgl-2026",  "title": "SSC CGL 2026",  "savedAt": "2026-04-11T..." }
  ]
}
```

---

### POST `/api/user/save/:postId` — 🔒
Toggle save/unsave. No request body required.

**Request:**
```
POST /api/user/save/663def456abc123
Authorization: Bearer eyJhbGc...
```

**Response — saved:**
```json
{ "success": true, "saved": true, "message": "Job saved successfully" }
```

**Response — unsaved:**
```json
{ "success": true, "saved": false, "message": "Job removed from saved list" }
```

**Response 404:**
```json
{ "success": false, "message": "Post not found" }
```

---

### GET `/api/user/mock-history` — 🔒
List all mock test attempts for the user.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "testId": "664abc...", "testTitle": "SSC CGL Mock Test 2024",
      "score": 18, "totalQ": 25, "timeTakenSec": 1200,
      "takenAt": "2026-04-10T08:30:00.000Z"
    }
  ]
}
```

---

### POST `/api/user/mock-history` — 🔒
Record a completed mock test attempt.

**Request body:**
```json
{ "testId": "664abc...", "score": 18, "totalQ": 25, "timeTakenSec": 1200 }
```
- `testId` — required (MongoDB ObjectId of the MockTest)
- `score` — number of correct answers
- `totalQ` — total questions attempted
- `timeTakenSec` — seconds taken

**Response 200:**
```json
{
  "success": true,
  "message": "Mock test recorded",
  "data": {
    "testId": "664abc...", "testTitle": "SSC CGL Mock Test 2024",
    "score": 18, "totalQ": 25, "timeTakenSec": 1200, "takenAt": "2026-04-12T..."
  }
}
```

**Response 400:**
```json
{ "success": false, "message": "testId required" }
```

---

### GET `/api/user/all` — 🔒 Admin
List all registered users. Supports pagination via `?page=1&limit=20`.

**Response 200:**
```json
{
  "success": true,
  "data": [
    { "_id": "...", "name": "Ankit Verma", "email": "...", "role": "user", "lastLoginAt": "...", "createdAt": "..." }
  ],
  "pagination": { "total": 342, "page": 1, "limit": 20, "totalPages": 18 }
}
```

---

## 3. NOTIFICATIONS — `/api/notify`

Welcome email sent on subscribe. Auto-alert email sent when a post is meaningfully updated. Manual trigger available for admin.

---

### GET `/api/notify/my` — 🔒
All active notification subscriptions for the current user.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "665abc...",
      "userId": "663abc...", "postId": "663def...",
      "slug": "upsc-cse-2026", "postTitle": "UPSC CSE 2026",
      "sectionCanonicalUrl": "latest-jobs",
      "isActive": true,
      "subscribedAt": "2026-04-10T...", "lastNotifiedAt": "2026-04-11T...",
      "createdAt": "...", "updatedAt": "..."
    }
  ]
}
```

---

### GET `/api/notify/status/:postId` — 🔒
Check whether current user is subscribed to a specific post.

**Response 200:**
```json
{ "success": true, "subscribed": true }
```
or
```json
{ "success": true, "subscribed": false }
```

---

### POST `/api/notify/subscribe/:postId` — 🔒
Subscribe to job post alerts. Sends welcome email asynchronously.

**Request:** No body needed.
```
POST /api/notify/subscribe/663def456abc123
Authorization: Bearer eyJhbGc...
```

**Response 201 (new subscription):**
```json
{ "success": true, "subscribed": true, "message": "Notification enabled" }
```

**Response 200 (already active):**
```json
{ "success": true, "subscribed": true, "message": "Already subscribed" }
```

**Response 200 (re-activated):**
```json
{ "success": true, "subscribed": true, "message": "Subscription re-activated" }
```

**Welcome email subject:** `✅ Notification Active: UPSC CSE 2026`

---

### DELETE `/api/notify/unsubscribe/:postId` — 🔒
Unsubscribe from a post's alerts. Sets `isActive: false` (record kept).

**Response 200:**
```json
{ "success": true, "subscribed": false, "message": "Notification disabled" }
```

---

### POST `/api/notify/manual/:postId` — Admin (no auth check currently)
Manually push email alert to all active subscribers of a post.

**Request body (optional):**
```json
{ "message": "Result has been declared — check the official website now!" }
```

**Response 200:**
```json
{ "success": true, "sent": 12, "total": 15 }
```
- `sent` — emails successfully delivered
- `total` — total active subscribers

**Response 200 (no subscribers):**
```json
{ "success": true, "sent": 0, "message": "No active subscribers" }
```

**Alert email subject:** `🔔 UPSC CSE 2026 — Result has been declared...`

---

### Auto-Notification (Internal)
When `PUT /api/post/id/:id` or `PUT /api/post/slug/:slug` is called, the post controller detects meaningful changes and calls `notifyPostSubscribers()` internally.

**Meaningful change fields:**
- `applyLastDate` — last date extended / changed
- `totalVacancies` — vacancies increased or decreased
- `status` — status label changed
- `isActive` — post activated or deactivated

---

## 4. JOB POSTS — `/api/post`

---

### POST `/api/post/add`
Create a single or bulk set of job posts.

**Request body (single):**
```json
{
  "data": {
    "title": "SSC CGL 2026 Recruitment",
    "slug": "ssc-cgl-2026",
    "jobtitle": "Combined Graduate Level",
    "dedupeKey": "ssc-cgl-2026-unique",
    "sourceUrl": "https://ssc.nic.in/...",
    "sectionName": "Latest Gov Jobs",
    "sectionCanonicalUrl": "latest-jobs",
    "category": "SSC",
    "language": "Hindi/English",
    "conductingAuthority": "SSC",
    "location": "All India",
    "totalVacancies": "17727",
    "applyLastDate": "2026-06-30T00:00:00.000Z",
    "salary": "Pay Level 4 to 7",
    "isActive": true,
    "tags": ["ssc", "cgl", "graduation"],
    "advertisementNumber": "CGL/2026/01"
  }
}
```

**Request body (bulk):**
```json
{ "data": [ { /* post 1 */ }, { /* post 2 */ } ] }
```

**Response 201:**
```json
{
  "success": true,
  "message": "Job post created",
  "data": {
    "_id": "663abc...", "title": "SSC CGL 2026 Recruitment",
    "slug": "ssc-cgl-2026", "createdAt": "2026-04-12T..."
  }
}
```

**Response 409 (duplicate slug):**
```json
{ "success": false, "message": "Duplicate key error", "field": "slug" }
```

---

### GET `/api/post/`
List job posts with filters and pagination.

**Query params:**
| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (default 1) |
| `limit` | number | Items per page (default 10) |
| `category` | string | Filter by category |
| `status` | string | Filter by status field |
| `language` | string | Filter by language |
| `tag` | string | Filter by tag |
| `search` | string | Text search on title |
| `sortBy` | string | Field to sort by |
| `order` | `asc`/`desc` | Sort direction |

**Response 200:**
```json
{
  "success": true,
  "message": "Job posts fetched",
  "data": [
    {
      "_id": "663abc...", "title": "SSC CGL 2026", "slug": "ssc-cgl-2026",
      "sectionName": "Latest Gov Jobs", "category": "SSC",
      "isActive": true, "applyLastDate": "2026-06-30T...", "createdAt": "..."
    }
  ],
  "pagination": { "total": 248, "page": 1, "limit": 10, "totalPages": 25 }
}
```

---

### GET `/api/post/id/:id`
Get single post by MongoDB ObjectId.

**Response 200:**
```json
{ "success": true, "data": { "_id": "...", "title": "...", "slug": "...", ... } }
```

---

### GET `/api/post/slug/:slug`
Get single post by slug. Used by frontend job detail page.

---

### GET `/api/post/dedupe/:dedupeKey`
Get post by its dedupe key (used by scrapper to avoid duplicates).

---

### GET `/api/post/get-deadline-jobs`
Posts where `applyLastDate` is within N days.

**Query params:** `days` (required), `page`, `limit`, `category`, `sectionCanonicalUrl`

**Response 200:**
```json
{
  "success": true,
  "reminder": "Jobs expiring in 7 days",
  "data": [ { "title": "...", "applyLastDate": "...", "slug": "..." } ],
  "pagination": { ... }
}
```

---

### GET `/api/post/get-posts-with-section`
All sections grouped with their posts. Used for homepage section rendering.

**Query params:** `sectionCanonicalUrl` (filter), `sortBy`, `order`

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "sectionName": "Latest Gov Jobs",
      "sectionCanonicalUrl": "latest-jobs",
      "posts": [ { "title": "...", "slug": "...", "isActive": true } ]
    }
  ]
}
```

---

### GET `/api/post/section-list/:sectionCanonicalUrl`
Paginated post list for a section.

**Query params:** `page`, `limit`, `search`, `order`

---

### PUT `/api/post/id/:id` or PUT `/api/post/slug/:slug`
Update job post. **Triggers auto-email** to subscribers if meaningful fields change.

**Request body:**
```json
{
  "data": {
    "applyLastDate": "2026-07-31T00:00:00.000Z",
    "totalVacancies": "18000",
    "isActive": true
  }
}
```

**Response 200:**
```json
{ "success": true, "message": "Updated", "data": { /* updated doc */ } }
```

---

### DELETE `/api/post/id/:id` or DELETE `/api/post/slug/:slug`
Permanently delete a post.

**Response 200:**
```json
{ "success": true, "message": "Deleted", "data": { /* deleted doc */ } }
```

---

### GET `/api/post/sitemap`
Minimal list for sitemap generation.

**Response:**
```json
{ "success": true, "data": [ { "slug": "ssc-cgl-2026", "updatedAt": "..." } ] }
```

---

### GET `/api/post/meta/:slug`
SEO meta fields for a slug.

**Response:**
```json
{ "success": true, "data": { "noIndex": false, "wordCount": 1200 } }
```

---

### GET `/api/post/states`
All distinct state values across posts.

**Response:**
```json
{ "success": true, "data": ["Bihar", "UP", "All India", "Rajasthan"] }
```

---

### GET `/api/post/filter`
Advanced filter.

**Query params:** `sectionName`, `state`, `page`, `limit`

---

## 5. JOB SECTIONS — `/api/postsection`

---

### POST `/api/postsection/add`
**Request:**
```json
{ "data": { "name": "Latest Gov Jobs", "status": "active" } }
```
- `name` — required; `canonicalUrl` auto-generated from name if missing
- `status` — `"active"` | `"inactive"` (default `"active"`)

**Response 201:**
```json
{ "success": true, "data": { "_id": "...", "name": "Latest Gov Jobs", "canonicalUrl": "latest-gov-jobs", "status": "active" } }
```

---

### GET `/api/postsection/`
**Query params:** `page`, `limit`, `status`, `search`, `sortBy`, `order`

---

### GET `/api/postsection/id/:id`
### GET `/api/postsection/canonical/:canonicalUrl`
### PUT `/api/postsection/id/:id`
### PUT `/api/postsection/canonical/:canonicalUrl`
### DELETE `/api/postsection/id/:id`
### DELETE `/api/postsection/canonical/:canonicalUrl`

---

## 6. BLOGS — `/api/blog`

---

### POST `/api/blog/add`
**Required fields:** `slug`, `title`, `excerpt`, `author`, `category`, `intro`

**Request:**
```json
{
  "data": {
    "slug": "how-to-prepare-for-ssc-cgl",
    "title": "SSC CGL Preparation Guide 2026",
    "excerpt": "Complete strategy to crack SSC CGL in first attempt.",
    "author": "Admin",
    "category": "Preparation",
    "intro": "SSC CGL is one of the most competitive exams...",
    "sections": [
      { "heading": "Syllabus Overview", "paragraphs": ["Tier 1 has...", "Tier 2 has..."], "bullets": ["GK", "Maths"] }
    ],
    "tags": ["ssc", "cgl", "preparation"]
  }
}
```

**Response 201:**
```json
{ "success": true, "data": { "_id": "...", "slug": "how-to-prepare-for-ssc-cgl", "title": "..." } }
```

---

### GET `/api/blog/`
**Query params:** `page`, `limit`, `category`, `author`, `tag`, `search`, `sortBy`, `order`

### GET `/api/blog/id/:id` / `GET /api/blog/slug/:slug`
### PUT `/api/blog/id/:id` / `PUT /api/blog/slug/:slug`
### DELETE `/api/blog/id/:id` / `DELETE /api/blog/slug/:slug`

---

## 7. SCHEMES (Yojana) — `/api/schemes`

> `officialSourceUrl` must be a `.gov.in` or `.nic.in` domain — enforced for YMYL compliance.

---

### POST `/api/schemes/add`
**Request:**
```json
{
  "data": {
    "schemeTitle": "PM Kisan Samman Nidhi",
    "slug": "pm-kisan-samman-nidhi",
    "schemetype": "Financial Assistance",
    "state": "All India",
    "city": "",
    "aboutScheme": "Rs 6000 per year to farmer families...",
    "process": "Apply via pmkisan.gov.in or nearest CSC.",
    "requiredDocs": ["Aadhaar", "Land records", "Bank passbook"],
    "schemeStartDate": "2019-02-24",
    "schemeLastDate": null,
    "applyLink": "https://pmkisan.gov.in/",
    "officialSourceUrl": "https://pmkisan.gov.in/",
    "isActive": true
  }
}
```

**Response 201:**
```json
{ "success": true, "data": { "_id": "...", "schemeTitle": "PM Kisan Samman Nidhi", "slug": "..." } }
```

---

### GET `/api/schemes/`
**Query params:** `page`, `limit`, `state`, `city`, `schemetype`, `search`, `sortBy`, `order`, `upcoming` (bool), `expired` (bool)

### GET `/api/schemes/getSchemeStateNameOnly`
Returns distinct state names:
```json
{ "success": true, "data": ["Bihar", "Rajasthan", "All India"] }
```

### GET `/api/schemes/slug/:slug`
### PUT `/api/schemes/slug/:slug`
### DELETE `/api/schemes/slug/:slug`

---

## 8. RESOURCES — `/api/resources`

Uploads to Cloudflare R2. Supports PDF, image, audio, video (max 100 MB for video).

---

### POST `/api/resources/`
Multipart form-data upload.

**Form fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | binary | Yes | PDF / image / audio / video |
| `title` | string | Yes | Display name |
| `type` | string | Yes | `pdf` / `image` / `audio` / `video` |
| `postId` | ObjectId | No | Link to a specific job post |
| `authorityKey` | string | No | e.g. `upsc`, `ssc`, `ibps` |
| `conductingAuthorityFull` | string | No | e.g. `Union Public Service Commission` |
| `description` | string | No | Short description |

**Allowed MIME types:** `application/pdf`, `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `audio/mpeg`, `audio/wav`, `video/mp4`, `video/webm`, `video/ogg`, `video/quicktime`

**Response 201:**
```json
{
  "success": true,
  "data": {
    "_id": "...", "title": "UPSC CSE 2025 Syllabus",
    "type": "pdf", "fileUrl": "https://pub-xxx.r2.dev/resources/...",
    "authorityKey": "upsc", "postId": "663abc...",
    "createdAt": "..."
  }
}
```

---

### GET `/api/resources/`
List all resources. **Query params:** `page`, `limit`, `type`, `authorityKey`, `postId`

### GET `/api/resources/by-post/:postId`
Returns authority-level + post-specific resources merged.

### GET `/api/resources/by-authority`
**Query params:** `authorityKey` OR `conductingAuthorityFull`

### PATCH `/api/resources/:id`
Update metadata (title, description, type, authorityKey, postId).

### DELETE `/api/resources/:id`
Deletes record from DB and file from R2.

---

## 9. MOCK TESTS — `/api/mock-tests`

Admin workflow: **Upload PDF → Review draft → Edit questions → Publish**

---

### POST `/api/mock-tests/upload-pdf`
Upload a text-based PDF. Extracts MCQs automatically using regex parser.

**Form fields (multipart):**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `pdf` | binary | Yes | PDF file (max 50 MB, text-based only) |
| `title` | string | Yes | Mock test name |
| `jobPostId` | ObjectId | No | Link to job post |
| `conductingAuthorityFull` | string | No | Full authority name |
| `durationMin` | number | No | Duration in minutes (default 60) |
| `difficulty` | string | No | `easy`/`medium`/`hard`/`mixed` (default `mixed`) |
| `examYear` | number | No | e.g. `2024` |
| `examStage` | string | No | e.g. `Tier 1` |

**PDF format expected (for best extraction):**
```
1. What is the capital of India?
A) Mumbai  B) Delhi  C) Chennai  D) Kolkata
Answer: B
Explanation: New Delhi is the capital.

2. Who wrote the Indian Constitution?
...
```

**Response 201:**
```json
{
  "success": true,
  "message": "Mock test created with 45 questions (8 rejected).",
  "data": {
    "_id": "664abc...", "title": "SSC CGL Mock Test 2024",
    "status": "draft", "totalQuestions": 45,
    "parseStats": {
      "totalExtracted": 45,
      "totalRejected": 8,
      "rejectionReasons": ["Expected 4 options, got 3", "Could not determine correct answer"]
    }
  }
}
```

**Response 422 (scanned PDF):**
```json
{ "success": false, "message": "No text extracted from PDF. File may be scanned/image-based." }
```

---

### GET `/api/mock-tests/`
Admin list. Questions and extractedText excluded.

**Query params:** `status` (`draft`/`review`/`published`/`archived`), `jobPostId`, `authorityKey`, `page`, `limit`

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "664abc...", "title": "SSC CGL Mock Test 2024",
      "status": "draft", "totalQuestions": 45,
      "durationMin": 60, "difficulty": "mixed",
      "authorityKey": "ssc", "jobPostId": "663abc...",
      "parseStats": { "totalExtracted": 45, "totalRejected": 8, "rejectionReasons": [...] },
      "createdAt": "...", "updatedAt": "..."
    }
  ],
  "pagination": { "total": 12, "page": 1, "limit": 20, "totalPages": 1 }
}
```

---

### GET `/api/mock-tests/by-post/:postId`
Only `published` tests for a job post. Used on the frontend.

---

### GET `/api/mock-tests/:id`
Full mock test including all questions (excludes `extractedText`).

**Response 200:**
```json
{
  "success": true,
  "data": {
    "_id": "664abc...", "title": "SSC CGL Mock Test 2024",
    "status": "draft", "durationMin": 60, "totalQuestions": 3,
    "questions": [
      {
        "_id": "664q01...",
        "question": "What is the capital of India?",
        "options": ["Mumbai", "Delhi", "Chennai", "Kolkata"],
        "correctIndex": 1,
        "explanation": "New Delhi is the capital.",
        "topic": "GK", "difficulty": "easy"
      }
    ]
  }
}
```

---

### PATCH `/api/mock-tests/:id`
Update metadata only (not questions). Fields `questions`, `extractedText`, `sourcePdfPath` are blocked.

**Request body (any updatable field):**
```json
{
  "title": "SSC CGL Mock Test 2024 — Updated",
  "durationMin": 45,
  "jobPostId": "663abc...",
  "difficulty": "hard"
}
```

---

### POST `/api/mock-tests/:id/publish`
Publish a draft. Requires at least 5 questions.

**Request body (optional):**
```json
{ "publishedBy": "admin@sarkariafsar.com" }
```

**Response 200:**
```json
{ "success": true, "message": "Mock test published", "data": { "_id": "...", "status": "published" } }
```

**Response 400 (too few questions):**
```json
{ "success": false, "message": "Cannot publish: minimum 5 questions required" }
```

---

### PATCH `/api/mock-tests/:id/questions/:qid`
Edit a single question by its `_id`.

**Request body (any subset of):**
```json
{
  "question": "What is the capital of India?",
  "options": ["Mumbai", "New Delhi", "Chennai", "Kolkata"],
  "correctIndex": 1,
  "explanation": "New Delhi has been capital since 1911.",
  "topic": "Indian Geography",
  "difficulty": "easy"
}
```

**Response 200:**
```json
{ "success": true, "message": "Question updated", "data": { /* updated question */ } }
```

---

### DELETE `/api/mock-tests/:id/questions/:qid`
Remove a single question.

**Response 200:**
```json
{ "success": true, "message": "Question removed", "totalQuestions": 44 }
```

---

### DELETE `/api/mock-tests/:id`
Delete entire mock test + cleans up uploaded PDF file from disk.

**Response 200:**
```json
{ "success": true, "message": "Mock test deleted" }
```

---

## 10. SEARCH — `/api/search`

### GET `/api/search/search-with-title?title=upsc`
Cross-entity search across posts, blogs, and schemes.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "posts":   [ { "_id": "...", "title": "UPSC CSE 2026", "slug": "..." } ],
    "blogs":   [ { "_id": "...", "title": "UPSC Preparation Tips", "slug": "..." } ],
    "schemes": [ { "_id": "...", "schemeTitle": "UPSC Related Scheme", "slug": "..." } ]
  }
}
```

---

## 11. STATS — `/api/stats`

### GET `/api/stats/posts`
### GET `/api/stats/blogs`
### GET `/api/stats/schemes`
```json
{ "success": true, "data": { "count": 248 } }
```

### GET `/api/stats/posts/advanced`
Posts grouped by conducting authority.

---

## 12. CACHE — `/api/cache`

### POST `/api/cache/flush`
Flush entire Redis cache.

### POST `/api/cache/flush-pattern`
```json
{ "pattern": "cache:/api/post*" }
```

---

## 13. SCRAPPER — `/api/scrapper`

### POST `/api/scrapper/run-section-cron`
Trigger section scraping cron manually.

### POST `/api/scrapper/fetch-section`
Fetch jobs for a specific section.

### POST `/api/scrapper/fetch-all-by-section`
Fetch all configured sections.

### POST `/api/scrapper/single-post-scrape`
Scrape and process a single post URL.

---

## 14. AI CRONS — `/api/ai-crons`

### POST `/api/ai-crons/run`
Trigger Gemini AI enrichment cron to process unenriched posts.

---

## 15. CONTENT TEMPLATES — `/api/content-template`

### POST `/api/content-template/add`
### GET `/api/content-template/`
### GET `/api/content-template/:id`
### PUT `/api/content-template/:id`
### DELETE `/api/content-template/:id`

---

## DATA MODELS

### User
```
_id           ObjectId
googleId      String (unique)
name          String
email         String (unique)
avatar        String (Google photo URL)
role          "user" | "admin"
savedJobs     [{ postId, slug, title, savedAt }]
mockTestHistory [{ testId, testTitle, score, totalQ, timeTakenSec, takenAt }]
lastLoginAt   Date
createdAt     Date
updatedAt     Date
```

### Notification
```
_id                ObjectId
userId             ObjectId (ref: User)
postId             ObjectId (ref: JobPost)
slug               String
postTitle          String
sectionCanonicalUrl String
isActive           Boolean (default: true)
subscribedAt       Date
lastNotifiedAt     Date | null
createdAt          Date
updatedAt          Date

Index: { userId, postId } unique  →  one subscription per user per post
Index: { postId, isActive }       →  fast lookup when post changes
```

### MockTest
```
_id                    ObjectId
title                  String (required)
jobPostId              ObjectId | null (ref: JobPost)
authorityKey           String lowercase (e.g. "upsc")
conductingAuthorityFull String
sourcePdfPath          String
sourcePdfName          String
extractedText          String (raw PDF text — excluded from list/detail APIs)
durationMin            Number (default 60)
totalQuestions         Number (auto-synced from questions array)
difficulty             "easy" | "medium" | "hard" | "mixed"
examYear               Number | null
examStage              String | null
language               String (default "Hindi/English")
isFree                 Boolean (default true)
status                 "draft" | "review" | "published" | "archived"
questions              [Question]
parseStats             { totalExtracted, totalRejected, rejectionReasons[] }
createdBy              String
reviewedBy             String | null
publishedBy            String | null
publishedAt            Date | null
createdAt / updatedAt
```

### Question (sub-document of MockTest)
```
_id           ObjectId
question      String (required)
options       [String] (exactly 4 required)
correctIndex  Number 0-3 (required)
explanation   String
topic         String
difficulty    "easy" | "medium" | "hard"
```

---

## ENVIRONMENT VARIABLES

### Server — `server/.env`
```env
SCRAPPER_PORT=5000
SCRAPPER_MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname

# Auth
JWT_SECRET=your_long_random_secret
GOOGLE_CLIENT_ID=446261549361-....apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
PRODUCTION_CALLBACK_URL=https://sarkariafsar.com/api/auth/google/callback
FRONTEND_URL=http://localhost:3000

# Mail — must use Gmail App Password (not account password)
MAIL_SERVICE=gmail
MAIL_USER=yourmail@gmail.com
MAIL_PASS=xxxx xxxx xxxx xxxx
ALERT_MAIL_TO=admin@gmail.com

# Gemini AI
GEMINI_API_KEYS=key1,key2,key3
GEMINI_MODELS=gemini-2.5-flash,gemini-2.0-flash,...

# Cloudflare R2
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=sarkariafsar
R2_PUBLIC_DOMAIN=https://pub-xxx.r2.dev/
```

### Frontend — `front/.env.local`
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```
> `SERVER_BASE` is derived in code: `API_BASE.replace(/\/api\/?$/, '')`
> Do NOT add `NEXT_PUBLIC_SERVER_BASE` separately.

---

## GOOGLE CLOUD CONSOLE SETUP

Go to: https://console.cloud.google.com → APIs & Services → Credentials → OAuth 2.0 Client

**Authorized JavaScript Origins:**
```
http://localhost:3000
https://sarkariafsar.com
```

**Authorized Redirect URIs:**
```
http://localhost:5000/api/auth/google/callback
https://sarkariafsar.com/api/auth/google/callback
```

---

## FRONTEND ROUTES

| Route | Description |
|-------|-------------|
| `/auth/callback?token=<JWT>` | OAuth landing — stores JWT in localStorage, redirects to `/dashboard` |
| `/dashboard` | User dashboard — saved jobs, active notifications, mock test history |
| `/jobs/[slug]` | Job detail page |
| `/jobs/[slug]` → Save button | Only shown for `sectionName === "Latest Gov Jobs"` |
| `/jobs/[slug]` → Notify button | Only shown for `sectionName === "Latest Gov Jobs"` |

---

## EMAIL NOTIFICATION FLOW

```
User clicks "Get Notified" on job detail page
  → POST /api/notify/subscribe/:postId   (JWT required)
  → DB: Notification record created (isActive: true)
  → Email: "✅ Notification Active: <post title>" sent async

Admin updates job post via PUT /api/post/id/:id
  → Controller detects changed fields (applyLastDate / totalVacancies / status / isActive)
  → notifyPostSubscribers() called internally
  → All active subscribers emailed: "🔔 <post title> — <change description>"

Admin clicks "Send Alert" in admin panel
  → POST /api/notify/manual/:postId  { "message": "Result declared!" }
  → All active subscribers emailed: "🔔 <post title> — Result declared!"
  → Response: { sent: 12, total: 15 }

User unsubscribes
  → DELETE /api/notify/unsubscribe/:postId
  → DB: isActive set to false (record preserved for history)
```

---

## ADMIN PANEL — SUGGESTED UI SCREENS

### 1. Dashboard
- Total posts / blogs / schemes / users (from `/api/stats/*`)
- Posts expiring in 7 days (from `/api/post/get-deadline-jobs?days=7`)
- Recent mock tests (from `/api/mock-tests?limit=5`)

### 2. Job Posts Manager
- Table: title, section, category, isActive, applyLastDate, vacancies
- Filters: search, category, section, status
- Actions: Edit (PUT), Delete, View on site
- Create form with all fields
- On update: shows which fields changed + auto-email warning

### 3. Sections Manager
- Table: name, canonicalUrl, status, post count
- CRUD via `/api/postsection`

### 4. Blogs Manager
- Table: title, author, category, createdAt
- CRUD via `/api/blog`

### 5. Schemes Manager
- Table: schemeTitle, state, schemetype, isActive, expiryDate
- CRUD via `/api/schemes`

### 6. Resources Manager
- Table: title, type, authorityKey, linked post, fileUrl
- Upload form: file picker + metadata fields
- CRUD via `/api/resources`

### 7. Mock Tests Manager
- Table: title, status, questions count, authorityKey, linked post
- Upload PDF → shows parseStats (extracted / rejected / reasons)
- Question editor: edit/delete individual questions
- Publish button (disabled if < 5 questions)
- CRUD via `/api/mock-tests`

### 8. Notifications Manager
- Table: postTitle, total subscribers, last notified
- "Send Alert" button → POST `/api/notify/manual/:postId` with custom message
- Shows subscribers count per post

### 9. Users Manager
- Table: name, email, role, savedJobs count, lastLoginAt
- Paginated list from `/api/user/all`

### 10. Cache Control
- "Flush All Cache" button → POST `/api/cache/flush`
- Pattern flush input → POST `/api/cache/flush-pattern`

### 11. AI & Scrapper Controls
- "Run AI Cron" button → POST `/api/ai-crons/run`
- "Run Scrapper" button → POST `/api/scrapper/run-section-cron`

---

## 16. ADMIN AUTH — `/api/admin`

Admin panel ka apna login system — Google OAuth se alag. Email + password based. JWT valid for **7 days**.

> Admin JWT aur User JWT alag hain. Admin JWT ke payload me `role: "admin"` hota hai.
> Admin protected routes pe `authAdmin` middleware use hota hai jo `role` check karta hai.

---

### POST `/api/admin/login` — Public
Admin email + password se login karo. JWT milega.

**Request body:**
```json
{ "email": "av95766@gmail.com", "password": "Avverma@1" }
```

**Response 200:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "_id": "663abc...",
    "name": "Ankit Verma",
    "email": "av95766@gmail.com",
    "lastLoginAt": "2026-04-12T11:10:00.000Z"
  }
}
```

**Response 400 (missing fields):**
```json
{ "success": false, "message": "Email aur password dono required hain" }
```

**Response 401 (wrong credentials):**
```json
{ "success": false, "message": "Invalid credentials" }
```

> Frontend — token ko `localStorage` me store karo (key: `admin_token`).
> Har admin API call me header bhejo: `Authorization: Bearer <token>`

---

### GET `/api/admin/me` — 🔒 Admin JWT required
Token verify karo aur admin info return karo. Panel load hote waqt call karo to check karo ki session valid hai.

**Request:**
```
GET /api/admin/me
Authorization: Bearer eyJhbGc...
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "_id": "663abc...",
    "name": "Ankit Verma",
    "email": "av95766@gmail.com",
    "lastLoginAt": "2026-04-12T11:10:00.000Z"
  }
}
```

**Response 401 (no/invalid token):**
```json
{ "success": false, "message": "Admin authentication required" }
```

**Response 403 (user JWT use kiya admin route pe):**
```json
{ "success": false, "message": "Access denied — not an admin token" }
```

---

### POST `/api/admin/change-password` — 🔒 Admin JWT required
Admin apna password change kare.

**Request body:**
```json
{ "currentPassword": "Avverma@1", "newPassword": "NewPass@123" }
```

**Response 200:**
```json
{ "success": true, "message": "Password successfully change ho gaya" }
```

**Response 401 (wrong current password):**
```json
{ "success": false, "message": "Current password galat hai" }
```

**Response 400 (too short):**
```json
{ "success": false, "message": "New password minimum 6 characters ka hona chahiye" }
```

---

## ADMIN MODEL

```
_id           ObjectId
email         String (unique, lowercase)
passwordHash  String (bcrypt, rounds=12)
name          String (default: "Admin")
isActive      Boolean (default: true)
lastLoginAt   Date | null
createdAt     Date
updatedAt     Date
```

---

## ADMIN SEED

Server start hote hi `seedAdmin()` automatically run hota hai (`index.js` me called after MongoDB connect).

- Agar DB me admin **nahi hai** → `av95766@gmail.com / Avverma@1` se create kar deta hai
- Agar admin **pehle se hai** → skip karta hai (duplicate kabhi nahi banega)

Manual seed (ek baar run karo):
```bash
node seed.js
```

---

## ADMIN PANEL — LOGIN FLOW (Frontend)

```
1. Admin panel open karo → /login page dikhe
2. Email + password form submit
   → POST /api/admin/login
   → token milne pe localStorage me save karo (key: admin_token)
   → redirect to /dashboard

3. Har page load pe token verify karo
   → GET /api/admin/me  (Authorization: Bearer <token>)
   → 401 aaye to /login pe redirect karo

4. Logout
   → localStorage se admin_token delete karo
   → /login pe redirect karo
```
