## Government Schemes API

Base route: `/api/schemes`

### `POST /schemes/add`
- Description: Nayi government scheme create karta hai.
- Body: `{ data: { schemeTitle, schemetype?, requiredDocs?, process?, state?, city?, schemeStartDate?, schemeLastDate?, applyLink?, aboutScheme? } }`

### `GET /schemes/`
- Description: Schemes ki paginated list.
- Query params:
	- `page` (number, default 1)
	- `limit` (number, default 10)
	- `state` (string)
	- `city` (string)
	- `schemetype` (string)
	- `search` (string) — text search across `schemeTitle`, `schemetype`, `state`, `city`, `process`, `aboutScheme`
	- `sortBy` (one of `createdAt|updatedAt|schemeTitle|schemeStartDate|schemeLastDate|state|city|schemetype`)
	- `order` (`asc` or `desc`)
	- `upcoming` (`true`) — filters `schemeLastDate >= now`
	- `expired` (`true`) — filters `schemeLastDate < now`

### `GET /schemes/slug/:slug`
- Description: Ek scheme `slug` se fetch karta hai (slug ya `_id` dono accept hota hai).

### `GET /schemes/:id`
- Description: MongoDB `_id` ke basis par scheme laata hai.

### `PUT /schemes/:id`
- Description: `_id` ke basis par scheme update karta hai.
- Body: `{ data: { ...fields to update... } }` — `schemeTitle` aur `requiredDocs` validated when present.

### `DELETE /schemes/:id`
- Description: `_id` ke basis par scheme delete karta hai.

## Notes
- `slug` field has been added to existing documents (unique-friendly slug generated from `schemeTitle`).
- Route order: `/slug/:slug` is registered before `/:id` to avoid conflicts.
- Use `/api/schemes/slug/:slug` to fetch by slug.

