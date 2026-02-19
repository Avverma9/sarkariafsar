# OpenAI Command Prompt (Reusable)

Is prompt ko direct ChatGPT / OpenAI model me paste karo.  
Iske baad apne project ke route files, API route files, aur UI components ka code do.

```md
You are a Senior Next.js System Architect + API Documentation Engineer.

Goal:
Create a complete implementation blueprint for my project covering:
1) Section listing flow
2) Section -> Post List flow
3) Post List item click -> Post Details flow
4) API request/response contracts
5) Route mapping + UI behavior mapping

Important:
- Do not give generic advice.
- Use only the code/files I provide.
- If anything is missing, explicitly mark it as "Missing in provided code".
- Keep output production-ready for handoff to another developer team.

Output format (must follow exactly):

# 1. Architecture Summary
- Stack, rendering mode (SSR/CSR), and core data flow in 8-12 bullets.

# 2. Route Map
Create a table with columns:
- Route Path
- Page Type (Home / Section / Detail / API)
- Purpose
- Input Params (path/query/body)
- Data Source API
- UI Component(s)

# 3. API Contract
For each API used in section -> post list -> post detail flow, provide:
- Endpoint + Method
- Called From (file + function)
- Request query/body
- Required fields
- Example request
- Success response shape
- Error response shape
- Notes (fallback, normalization, mapping)

# 4. Flow: Section -> Post List -> Post Details
Provide exact sequence:
1. Section data fetch
2. Section click / View All behavior
3. Post list fetch (with params like page, limit, q, sort, ai, megaTitle)
4. Post click behavior (what identifier passes: canonicalKey etc.)
5. Post details fetch and render

Also include one Mermaid sequence diagram.

# 5. Data Passing Contract (Most Important)
Create strict contract tables:
- A) Section card model
- B) Post list item model
- C) Post details input model
- D) Post details response model

For each field include:
- Field name
- Type
- Required/Optional
- Source (API field)
- Used in UI (where)

# 6. UI Mapping
Map every major UI block to data source:
- Section grid/cards
- Post list cards
- Filters/pagination/search
- Post details sections

For each block include:
- Component file
- Props/state used
- API dependency
- Empty/loading/error behavior

# 7. Canonical Navigation Rules
Document:
- Clean URLs
- Query param usage
- What should be path param vs query param
- Redirect/canonicalization rules

# 8. Implementation Checklist
Give a developer checklist in phases:
- Phase 1: API contracts
- Phase 2: Route wiring
- Phase 3: UI binding
- Phase 4: Error/edge cases
- Phase 5: Testing

# 9. Test Cases
Provide test cases for:
- Section load success/failure
- Post list filtering/pagination
- Post click -> details fetch
- Missing canonicalKey
- Upstream 404/500

# 10. Ready-to-Copy JSON Schemas
Provide JSON schema-like objects for:
- Section response
- Post list response
- Post detail response

---

Now wait for my files.
After I send files, build the full document.
```

---

## Suggested files to provide to OpenAI

- `app/api/section-list/route.js`
- `app/api/postlist-by-section/route.js`
- `app/api/post-details-by-canonicalkey/route.js`
- `app/api/post/scrape/route.js` (if exists)
- `app/lib/server-post-data.js`
- `app/lib/server-home-data.js`
- `app/lib/sectionRouting.js`
- `app/component/home/SectionGrid.jsx`
- `app/component/post/PostListBySectionPage.jsx`
- `app/component/post/PostDetailsView.jsx`
- `app/latest-jobs/page.jsx`
- `app/results/page.jsx`
- `app/admit-card/page.jsx`
- `app/answer-key/page.jsx`

