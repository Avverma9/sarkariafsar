<!--
Full API documentation focused on Government Schemes with examples and
instructions. This file documents routes mounted under `/api` in the server.
-->
# Government Schemes API (Full Reference)

Base path: `/api/schemes`

Overview:
- The server exposes CRUD operations for government schemes plus helper
	endpoints to list states and filter schemes by state. Each scheme now
	includes a `slug` field (generated from `schemeTitle`) for friendly URLs.

Server startup (for local testing):
1. Add environment variables in a `.env` file if needed, e.g. `SCRAPPER_MONGO_URI`.
2. From project root run:

```bash
node index.js
```

3. API base when running locally: `https://sarkariafsar.com/api/api/schemes`

Notes before using endpoints:
- A migration script was added: `server/scripts/add_slug_to_schemes.js`.
	Run it once to populate `slug` for existing documents:

```bash
node server/scripts/add_slug_to_schemes.js
```

- The router registers `/slug/:slug` before `/:id` so slug route won't
	collide with id route.

Authentication/authorization: None by default in this codebase. All
endpoints are open unless you add middleware.

---

## Endpoints

### Create one or many schemes
- `POST /schemes/add`
- Body (single):

```json
{
	"data": {
		"schemeTitle": "Example Scheme",
		"schemetype": "welfare",
		"requiredDocs": ["id", "address"],
		"process": "apply online",
		"state": "Bihar",
		"city": "Patna",
		"schemeStartDate": "2025-01-01",
		"schemeLastDate": "2025-12-31",
		"applyLink": "https://example.gov/apply",
		"aboutScheme": "Details..."
	}
}
```

- Body (bulk):

```json
{ "data": [ { ... }, { ... } ] }
```

- Responses:
	- 201 Created with created document(s) on success.
	- 400 Validation errors.

### List schemes (paginated)
- `GET /schemes/`
- Query params:
	- `page` (number, default 1)
	- `limit` (number, default 10)
	- `state`, `city`, `schemetype` (filter exact match)
	- `search` (text search across title, type, state, city, process, aboutScheme)
	- `sortBy` (one of: createdAt, updatedAt, schemeTitle, schemeStartDate, schemeLastDate, state, city, schemetype)
	- `order` (`asc` or `desc`)
	- `upcoming=true` (filters schemeLastDate >= now)
	- `expired=true` (filters schemeLastDate < now)

- Example:

```bash
curl 'https://sarkariafsar.com/api/schemes?page=1&limit=20&search=scholarship&state=Bihar'
```

### Get scheme by slug
- `GET /schemes/slug/:slug`
- Accepts slug (string). Implementation also accepts `_id` when the path
	value is a valid ObjectId.

- Example:

```bash
curl 'https://sarkariafsar.com/api/schemes/slug/bihar-student-credit-card-yojana'
```

### Get scheme by id
- `GET /schemes/:id`
- Example:

```bash
curl 'https://sarkariafsar.com/api/schemes/69a143e9c16e4f567eda0296'
```

### Update scheme
- `PUT /schemes/:id`
- Body: `{ "data": { ...fields to update... } }`
- Validation: `schemeTitle` cannot be empty when present; `requiredDocs` must be array when present.

Example:

```bash
curl -X PUT 'https://sarkariafsar.com/api/schemes/69a143e9c16e4f567eda0296' \
	-H 'Content-Type: application/json' \
	-d '{"data":{"city":"New City"}}'
```

### Delete scheme
- `DELETE /schemes/:id`

Example:

```bash
curl -X DELETE 'https://sarkariafsar.com/api/schemes/69a143e9c16e4f567eda0296'
```

### Get list of distinct state names
- `GET /schemes/getSchemeStateNameOnly`
- Returns: array of state names (strings) sorted alphabetically.

Example:

```bash
curl 'https://sarkariafsar.com/api/schemes/getSchemeStateNameOnly'
```

### Get schemes filtered by state
- `GET /schemes/getSchemeByState?state=<state>&page=1&limit=10&search=...`
- Supports same pagination / search / sortBy / order / upcoming / expired query params as list endpoint.

Example:

```bash
curl 'https://sarkariafsar.com/api/schemes/getSchemeByState?state=Bihar&page=1&limit=20&search=scholarship'
```

---

## Developer notes & recommendations

- Indexing: add an index on `slug` and `state` in `models/schemes.js` for faster queries. Example schema addition:

```js
slug: { type: String, index: true },
state: { type: String, index: true },
```

- Slug generation: `server/scripts/add_slug_to_schemes.js` was run to seed existing docs. For new documents, consider adding a pre-save Mongoose hook to auto-generate slug from `schemeTitle` and ensure uniqueness.

- Testing: Use the curl examples above or Postman to verify endpoints.

If you want, I can:
- Add `slug` and `state` indexes to `models/schemes.js` now.
- Add a Mongoose pre-save hook to auto-generate slugs on create/update.
- Create Postman collection with these endpoints.

### Posts APIs
- Base path: `POST /post` (router mounted under `/api/post`)
- Endpoints:
	- `POST /post/add` — Create a job post.
		- Body: `{ "data": { "title": "...", "slug": "optional-or-generated", "jobtitle": "...", "sectionName": "...", "sectionCanonicalUrl": "...", "category": "...", "language": "...", "sourceUrl": "...", "applyLastDate": "2025-01-01", "tags": ["tag1","tag2"], "dedupeKey": "...", "scrapedContent": {"contentHtml":"..."} } }`
		- Response: `201 Created` with created document(s) on success; `400` for validation errors; `409` for duplicate `dedupeKey` or unique fields.
	- `GET /post/` — List job posts (supports pagination/filtering in controller).
		- Query params: `page`, `limit`, `search` (text), and other filters implemented by server.
		- Response: `200 OK` with an array of job posts (paginated) — e.g. `{ "success": true, "data": [ {...}, ... ], "page": 1, "limit": 20, "total": 123 }`.
	- `GET /post/id/:id` — Get job post by Mongo `_id`.
	- `GET /post/slug/:slug` — Get job post by `slug`.
	- `GET /post/dedupe/:dedupeKey` — Get job post by `dedupeKey`.
	- `GET /post/get-deadline-jobs` — Helper to get posts nearing deadline.
	- `GET /post/get-posts-with-section` — Helper returning posts with section info.
	- `GET /post/section-list/:sectionCanonicalUrl` — Posts by section canonical url.
	- `PUT /post/id/:id` — Update by id. Body: `{ "data": { ...fields to update... } }` — `200 OK` with updated doc or `400` for validation.
	- `PUT /post/slug/:slug` — Update by slug.
	- `DELETE /post/id/:id` — Delete by id.
	- `DELETE /post/slug/:slug` — Delete by slug.

### Blog APIs
- Base path: `POST /blog` (router mounted under `/api/blog`)
- Endpoints:
	- `POST /blog/add` — Create a blog post.
		- Body: `{ "data": { "slug": "unique-slug", "title": "...", "excerpt": "...", "author": "...", "category": "...", "intro": "...", "sections": [{ "heading": "...", "paragraphs": ["..."], "bullets": ["..."] }], "tags": ["..."], "publishedAt": "2025-01-01" } }`
		- Response: `201 Created` with created document; `400` for missing required fields; `409` for duplicate `slug`.
	- `GET /blog/` — List blogs (supports pagination/filtering).
		- Query params: `page`, `limit`, `search`, `category`, `tags`, etc.
		- Response: `200 OK` with array of blog documents and pagination metadata.
	- `GET /blog/id/:id` — Get blog by `_id`.
	- `GET /blog/slug/:slug` — Get blog by `slug`.
	- `PUT /blog/id/:id` — Update blog by id. Body: `{ "data": { ... } }`.
	- `PUT /blog/slug/:slug` — Update blog by slug.
	- `DELETE /blog/id/:id` — Delete blog by id.
	- `DELETE /blog/slug/:slug` — Delete blog by slug.

Notes on request/response conventions:
- Many controllers use a pattern of returning JSON with `success`, `message`, and `data` fields (e.g., errors return `{ success: false, message: '...', errors?: [...] }`).
- Create endpoints return `201 Created` with the created document; GET returns `200 OK` with either a single document or an array; validation or mongoose errors return `400` or `409` as appropriate.

**Smoke Test Results**
- **Tested Endpoints:** `GET /schemes`, `GET /schemes/getSchemeStateNameOnly`, `GET /post`, `GET /blog`, `POST /schemes/add`, `POST /post/add`, `POST /blog/add`, and the corresponding `DELETE` endpoints used in cleanup.
- **Status:** All tested endpoints responded successfully in local smoke tests (create → read → delete flows verified).
- **Fixes Applied:**
	- `controllers/post.js`: `addJobPost` now respects request body `data` when provided; falls back to internal `postData` only for seeding.
	- `controllers/schemes.js`: removed a duplicate `getGovSchemeBySlug` override so the original handler (which accepts ObjectId or slug) is used.
- **Test scripts added:** `server/tests/smoke.js` (quick GET checks) and `server/tests/create_and_cleanup.js` (create + delete verification).
- **Notes / Next steps:**
	- If you want, I can (a) run more exhaustive tests (filters, pagination, update flows), (b) generate a Postman collection, or (c) add Mongoose indexes and pre-save slug hook as suggested earlier.
	- To reproduce locally: start the server with `node index.js` and run `node tests/create_and_cleanup.js` from the `server` folder.


