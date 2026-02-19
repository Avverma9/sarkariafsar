## Live verification (19 Feb 2026, 08:35-08:37 UTC)

- `https://sarkariafsar.com/sitemap.xml` -> `200 OK` (`Content-Type: application/xml`)
- `https://sarkariafsar.com/latest-jobs` -> `200 OK`
- `https://sarkariafsar.com/results` -> `200 OK`
- `https://sarkariafsar.com/admit-card` -> `200 OK`
- `https://sarkariafsar.com/answer-key` -> `200 OK`
- `https://sarkariafsar.com/post/org-ssc-cpo-nic-out-paper-ssc-ssc-fd67bc30` -> `200 OK`

Note:
- "Cache miss" in many crawler tools often means their own cache/proxy miss, not necessarily origin failure.
- If Search Console still shows old `HTTP 400`, that can be historical/stale crawl data. Re-test in URL Inspection and re-submit sitemap.
- Current app is configured fully dynamic/no-store in `app/layout.js` (`dynamic = "force-dynamic"`, `revalidate = 0`, `fetchCache = "force-no-store"`), so cache hits are not expected by design.
URL	HTTP status / fetch result	Redirect target	Title tag (observed)	Meta description	H1 (observed)	Canonical tag	Robots meta	Word count (visible text)	Page load time	Main content snippet (observed)	Issues detected	Concise recommended fix	Evidence
https://sarkariafsar.com/sitemap.xml	HTTP 400 (unreachable)	N/A	N/A	N/A	N/A	N/A	N/A	N/A	N/A	N/A	Technical: sitemap fetch fails (blocks discovery + reporting).	Fix server/CDN so /sitemap.xml returns 200 with valid XML. Validate XML and ensure consistent hostnames in <loc>. 2	1
https://sarkariafsar.com/	Fetched successfully (likely 200)	Not observed	“SarkariAfsar - Latest Sarkari Result & Govt Jobs”	Not extractable from rendered text in this crawl	“Sarkari Afsar” (page heading text)	Not extractable	Not extractable	~964 (includes long job/result lists; “meaningful narrative” is much lower)	Not measured	“India’s most trusted portal for Sarkari Naukri…” + large lists of jobs/results. 5	On-page: duplicated “Updates” items; tool links appear to share same destination; possible duplicate “Terms” destinations. Content quality: heavy list density may reduce perceived helpfulness if not structured well.	De-duplicate ticker/list rendering; ensure each “tool” has its own crawlable URL and unique content; consolidate terms URLs via canonical/redirect. 6	5
https://sarkariafsar.com/latest-jobs	Unreachable (“Cache miss”)	Unknown	N/A	N/A	N/A	N/A	N/A	N/A	N/A	N/A	Technical: fetch failure; SEO: category hub likely unindexable.	Fix routing/CDN so deep links render server-side and return stable 200 to crawlers; verify with URL Inspection after fix. 10	11
https://sarkariafsar.com/mock-test	Unreachable (“Cache miss”)	Unknown	N/A	N/A	N/A	N/A	N/A	N/A	N/A	N/A	Technical: fetch failure; tool section likely unindexable.	Same as above; also ensure internal links are crawlable and point to the canonical URL. 12	13
https://sarkariafsar.com/results	Unreachable (“Cache miss”)	Unknown	N/A	N/A	N/A	N/A	N/A	N/A	N/A	N/A	Technical: fetch failure; results hub likely unindexable.	Stabilize origin/CDN for this route; once reachable, add unique meta description and clear heading hierarchy. 14	15
https://sarkariafsar.com/admit-card	Unreachable (“Cache miss”)	Unknown	N/A	N/A	N/A	N/A	N/A	N/A	N/A	N/A	Technical: fetch failure; admit-card hub likely unindexable.	Stabilize route; apply consistent canonical + avoid duplicate URLs. 6	16
https://sarkariafsar.com/answer-key	Unreachable (“Cache miss”)	Unknown	N/A	N/A	N/A	N/A	N/A	N/A	N/A	N/A	Technical: fetch failure; answer key hub likely unindexable.	Stabilize route; once accessible, ensure unique titles/meta descriptions. 14	17
https://sarkariafsar.com/about	Unreachable (“Cache miss”)	Unknown	N/A	N/A	N/A	N/A	N/A	N/A	N/A	N/A	Technical: fetch failure; trust/brand page unindexable.	Fix fetchability; then add Organization schema + consistent contact info. Validate schema. 18	19
https://sarkariafsar.com/contact	Unreachable (“Cache miss”)	Unknown	N/A	N/A	N/A	N/A	N/A	N/A	N/A	N/A	Technical: fetch failure.	Fix fetchability; ensure contact page isn’t blocked by robots/noindex (if intended to rank). 18	20
https://sarkariafsar.com/privacy-policy	Unreachable (“Cache miss”)	Unknown	N/A	N/A	N/A	N/A	N/A	N/A	N/A	N/A	Technical: fetch failure.	Fix fetchability; then consolidate duplicate legal URLs with canonical/redirect. 6	21
https://sarkariafsar.com/terms-of-service	Unreachable (“Cache miss”)	Unknown	N/A	N/A	N/A	N/A	N/A	N/A	N/A	N/A	Technical: fetch failure; Duplicate risk: also have /terms-and-condition.	Choose one canonical legal URL; 301 redirect the other; avoid conflicting canonicals/noindex. 6	22
https://sarkariafsar.com/terms-and-condition	Unreachable (“Cache miss”)	Unknown	N/A	N/A	N/A	N/A	N/A	N/A	N/A	N/A	Technical: fetch failure; Duplicate risk: “Terms” likely duplicated.	Same consolidation approach as above (single canonical + redirect). 6	23
https://sarkariafsar.com/blog	Unreachable (“Cache miss”)	Unknown	N/A	N/A	N/A	N/A	N/A	N/A	N/A	N/A	Technical: fetch failure; content marketing hub unindexable.	Fix fetchability; once live, ensure unique titles/meta descriptions per post and avoid scaled/templated thin posts. 14	24
https://sarkariafsar.com/guides	Unreachable (“Cache miss”)	Unknown	N/A	N/A	N/A	N/A	N/A	N/A	N/A	N/A	Technical: fetch failure; IA issue: tool links appear to route here.	Ensure each tool has its own URL/content; keep “Guides” as a true guide hub. 12	9
https://sarkariafsar.com/post/ecgc-out-9d1e2e70	Unreachable (“Cache miss”)	Unknown	N/A	N/A	N/A	N/A	N/A	N/A	N/A	N/A	Technical: post fetch failure; likely core content URL unreachable.	Fix post route rendering; verify stable 200; add canonical + structured data appropriate to content. 6	25
https://sarkariafsar.com/post/org-ibps-clerk-csa-ibps-mains-out-fd76b510	Unreachable (“Cache miss”)	Unknown	N/A	N/A	N/A	N/A	N/A	N/A	N/A	N/A	Technical: post fetch failure.	Same as above.	26
https://sarkariafsar.com/post/code-01-2027-01-agniveer-airforce-extend-indian-intake-vayu-7d67d93c	Unreachable (“Cache miss”)	Unknown	N/A	N/A	N/A	N/A	N/A	N/A	N/A	N/A	Technical: post fetch failure.	Same as above; ensure “lastmod” in sitemap reflects meaningful updates. 2	27
https://sarkariafsar.com/post/58th-army-course-entry-indian-ncc-scheme-special-2535c8d6	Unreachable (“Cache miss”)	Unknown	N/A	N/A	N/A	N/A	N/A	N/A	N/A	N/A	Technical: post fetch failure.	Same as above.	28
