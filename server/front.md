# Sarkari Afsar — Next.js Frontend: Full Specification

> **Project:** sarkariafsar.com  
> **Stack:** Next.js 14+ (App Router) · TypeScript · Tailwind CSS · shadcn/ui  
> **Goal:** Google-AdSense-ready, bot-friendly, Core-Web-Vitals-optimised portal for सरकारी नौकरी (Sarkari Jobs) + Government Schemes.

---

## Table of Contents
1. [Tech Stack](#1-tech-stack)
2. [Folder Structure](#2-folder-structure)
3. [Environment Variables](#3-environment-variables)
4. [SEO Architecture (Google 2025/2026)](#4-seo-architecture)
5. [Performance / Core Web Vitals](#5-performance--core-web-vitals)
6. [Google AdSense Approval Checklist](#6-google-adsense-approval-checklist)
7. [OpenAI Integration Spec](#7-openai-integration-spec)
8. [UI Specification (Pages & Components)](#8-ui-specification)
9. [API Map (Backend ↔ Frontend)](#9-api-map)
10. [Structured Data (JSON-LD) Templates](#10-structured-data-templates)
11. [Sitemap & Robots](#11-sitemap--robots)
12. [Dependency Manifest](#12-dependency-manifest)

---

## 1. Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 14+ (App Router) | RSC, ISR, streaming — best for SEO |
| Language | TypeScript | Type-safe API contracts |
| Styling | Tailwind CSS v3 + shadcn/ui | Fast utility CSS, accessible components |
| Icons | lucide-react | Lightweight, tree-shakeable |
| Fonts | Google Fonts: Hind (Hindi UI) + Inter (Latin) via `next/font` | CLS = 0 font loading |
| State | Zustand (light client state only) | Minimal bundle |
| Data fetching | `fetch` with Next.js `cache` / `revalidate` | Native ISR, no extra lib needed |
| SEO meta | next/metadata API | Type-safe, route-level metadata |
| Structured data | Custom JSON-LD components (server-side) | Zero JS cost |
| Analytics | Google Analytics 4 (via `@next/third-parties/google`) | Partytown-isolated |
| Ads | Google AdSense (via `next/script` strategy="lazyOnload") | Non-blocking |
| AI | OpenAI API (gpt-4o-mini) | Fast, cheap, Hindi-aware |
| Image CDN | next/image + WebP | LCP optimisation |
| Search | Backend `/search` endpoint | Fast UX, no extra SaaS cost |

---

## 2. Folder Structure

```
frontend/
├── app/
│   ├── layout.tsx                     # Root layout — fonts, GA4, AdSense, global JSON-LD
│   ├── page.tsx                       # Home page  (ISR: revalidate 3600)
│   ├── robots.ts                      # Dynamic robots.txt
│   ├── sitemap.ts                     # Root sitemap index
│   │
│   ├── (jobs)/                        # Job Posts route group
│   │   ├── jobs/
│   │   │   ├── page.tsx               # Job listing  (ISR 1800s)
│   │   │   ├── [slug]/
│   │   │   │   └── page.tsx           # Job detail   (ISR 3600s)
│   │   │   └── sitemap.ts             # /jobs sitemap chunk
│   │   └── category/[category]/page.tsx
│   │
│   ├── (schemes)/                     # Gov Schemes route group
│   │   ├── yojana/
│   │   │   ├── page.tsx               # Scheme listing (ISR 86400s)
│   │   │   ├── [slug]/
│   │   │   │   └── page.tsx           # Scheme detail  (ISR 86400s)
│   │   │   └── sitemap.ts
│   │   └── state/[state]/page.tsx     # Schemes filtered by state
│   │
│   ├── (blog)/
│   │   ├── blog/
│   │   │   ├── page.tsx
│   │   │   └── [slug]/page.tsx
│   │   └── sitemap.ts
│   │
│   ├── (search)/
│   │   └── search/page.tsx            # Client-side search (noindex)
│   │
│   ├── (static)/                      # AdSense required pages
│   │   ├── about/page.tsx
│   │   ├── contact/page.tsx
│   │   ├── privacy-policy/page.tsx
│   │   ├── disclaimer/page.tsx
│   │   └── sitemap-page/page.tsx      # HTML sitemap for crawlers
│   │
│   └── api/                           # Next.js API routes (proxy + AI)
│       ├── ai/summarize/route.ts      # OpenAI summarize
│       ├── ai/faq/route.ts            # OpenAI FAQ generator
│       ├── ai/translate/route.ts      # Hindi <> English translation
│       ├── og/route.tsx               # Dynamic OG image (Edge)
│       └── revalidate/route.ts        # On-demand ISR revalidation webhook
│
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── MobileNav.tsx
│   │   └── Breadcrumb.tsx
│   ├── seo/
│   │   ├── JsonLd.tsx                 # Generic JSON-LD injector
│   │   └── CanonicalHead.tsx
│   ├── ads/
│   │   ├── AdsenseUnit.tsx            # Reusable AdSense slot
│   │   └── AdsenseInArticle.tsx
│   ├── jobs/
│   │   ├── JobCard.tsx
│   │   ├── JobList.tsx
│   │   ├── JobFilters.tsx
│   │   └── JobDetail.tsx
│   ├── schemes/
│   │   ├── SchemeCard.tsx
│   │   ├── SchemeList.tsx
│   │   ├── SchemeFilters.tsx
│   │   └── SchemeDetail.tsx
│   ├── blog/
│   │   ├── BlogCard.tsx
│   │   └── BlogDetail.tsx
│   ├── ai/
│   │   ├── AiSummaryBox.tsx           # AI summary on detail pages
│   │   ├── AiFaqSection.tsx           # AI-generated FAQ (also schema)
│   │   └── AiChatWidget.tsx           # Floating chat (optional)
│   ├── search/
│   │   ├── SearchBar.tsx
│   │   └── SearchResults.tsx
│   └── common/
│       ├── Pagination.tsx
│       ├── Skeleton.tsx
│       ├── ShareButtons.tsx           # Web Share API + copy link
│       ├── LastUpdated.tsx
│       └── StateBadge.tsx
│
├── lib/
│   ├── api/
│   │   ├── jobs.ts
│   │   ├── schemes.ts
│   │   ├── blog.ts
│   │   ├── search.ts
│   │   └── stats.ts
│   ├── openai.ts                      # OpenAI client singleton
│   ├── metadata.ts                    # Shared metadata builder helpers
│   ├── structuredData.ts              # JSON-LD builder functions
│   ├── indexNow.ts                    # IndexNow ping util
│   └── utils.ts
│
├── public/
│   ├── favicon.ico
│   ├── logo.svg
│   ├── og-default.png                 # 1200x630 default OG image
│   └── site.webmanifest
│
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 3. Environment Variables

```env
# --- Backend API ---
NEXT_PUBLIC_API_BASE_URL=https://sarkariafsar.com/api

# --- OpenAI ---
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

# --- Google ---
NEXT_PUBLIC_GA4_ID=G-XXXXXXXXXX
NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-XXXXXXXXXXXXXXXX
NEXT_PUBLIC_SITE_URL=https://sarkariafsar.com

# --- ISR On-demand Revalidation ---
REVALIDATE_SECRET=your-secret-token

# --- IndexNow (Bing/Yandex instant indexing) ---
INDEXNOW_KEY=your-indexnow-key
```

---

## 4. SEO Architecture

### 4.1 Metadata Strategy (next/metadata API)

Every page exports a `generateMetadata()` function. Example for a job detail page:

```ts
// app/(jobs)/jobs/[slug]/page.tsx
import type { Metadata } from "next";

export async function generateMetadata({ params }): Promise<Metadata> {
  const job = await getJobBySlug(params.slug);
  const canonical = `${process.env.NEXT_PUBLIC_SITE_URL}/jobs/${job.slug}`;

  return {
    title: `${job.title} 2026 — Sarkari Afsar`,
    description: job.shortDesc?.slice(0, 155) ?? `Apply for ${job.title}. Last date: ${job.applyLastDate}.`,
    alternates: { canonical },
    openGraph: {
      title: job.title,
      description: job.shortDesc,
      url: canonical,
      siteName: "Sarkari Afsar",
      images: [{
        url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/og?title=${encodeURIComponent(job.title)}`,
        width: 1200,
        height: 630,
      }],
      locale: "hi_IN",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: job.title,
      description: job.shortDesc,
      site: "@sarkariafsar",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-snippet": -1 },
    },
  };
}
```

### 4.2 Hreflang (Hindi + English)

```ts
// In metadata alternates
alternates: {
  canonical: "https://sarkariafsar.com/jobs/slug",
  languages: {
    "hi-IN": "https://sarkariafsar.com/hi/jobs/slug",
    "en-IN": "https://sarkariafsar.com/jobs/slug",
    "x-default": "https://sarkariafsar.com/jobs/slug",
  },
},
```

### 4.3 Dynamic OG Image (next/og — Edge Runtime)

```ts
// app/api/og/route.tsx
import { ImageResponse } from "next/og";
export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") ?? "Sarkari Afsar";

  return new ImageResponse(
    (
      <div style={{
        background: "#1e3a5f", color: "white", display: "flex",
        flexDirection: "column", width: "100%", height: "100%",
        padding: 60, justifyContent: "center",
      }}>
        <p style={{ fontSize: 18, color: "#f59e0b" }}>SarkariAfsar.com</p>
        <h1 style={{ fontSize: 52, fontWeight: 700, lineHeight: 1.2 }}>{title}</h1>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
```

### 4.4 IndexNow (Instant Google/Bing/Yandex Ping)

```ts
// lib/indexNow.ts
export async function pingIndexNow(urls: string[]) {
  await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      host: "sarkariafsar.com",
      key: process.env.INDEXNOW_KEY,
      urlList: urls,
    }),
  });
}
```

Call this from the revalidate webhook route whenever a new post or scheme is created.

### 4.5 Google 2025/2026 Ranking Signals Coverage

| Signal | Implementation |
|---|---|
| **Helpful Content** | AI summaries labelled "AI सहायक"; all detail pages have unique readable content |
| **E-E-A-T** | Author byline on blog, About page with team info, schema `author` fields |
| **Core Web Vitals** | See section 5 |
| **Mobile-first** | Tailwind responsive-first, no fixed widths |
| **HTTPS** | Vercel auto TLS |
| **Structured Data** | JobPosting, GovernmentService, BreadcrumbList, FAQPage, Article, SiteLinksSearchBox |
| **Page Experience** | No intrusive interstitials; ads placed below fold and in-article only |
| **Internal Linking** | Related jobs/schemes cards on every detail page |
| **Crawl Budget** | Only canonical URLs in sitemap; search is `noindex`; deep pagination is `noindex` |
| **INP** | All mutations use React `useTransition`; heavy components are lazy-loaded |
| **AI Overviews** | FAQPage + clear H2 structure makes content eligible for AI Overviews snippets |

---

## 5. Performance / Core Web Vitals

### 5.1 LCP (Largest Contentful Paint) — Target < 2.5s

- Hero image uses `<Image priority fetchPriority="high" />`.
- Fonts via `next/font/google` with `display: swap` and `preload: true`.
- ISR for all listing/detail pages — HTML served from CDN edge.
- `next.config.ts` enables WebP/AVIF auto conversion.

### 5.2 CLS (Cumulative Layout Shift) — Target < 0.1

- All `<Image>` tags have explicit `width` and `height`.
- AdSense units inside a `min-h-[250px]` container.
- Skeleton components match final content dimensions pixel-for-pixel.
- Fonts loaded via `next/font` — zero FOUT.

### 5.3 INP (Interaction to Next Paint) — Target < 200ms

- `useTransition` wraps all filter state changes.
- Pagination navigation uses `<Link prefetch={true}>`.
- Search uses 300ms debounce + `startTransition`.
- No blocking third-party scripts in `<head>`.

### 5.4 Bundle Optimisation (next.config.ts)

```ts
const nextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200],
    remotePatterns: [{ hostname: "sarkariafsar.com" }],
  },
  compress: true,
};
export default nextConfig;
```

---

## 6. Google AdSense Approval Checklist

### 6.1 Required Pages

| Page | URL | Content Requirement |
|---|---|---|
| About Us | `/about` | Who we are, team, mission statement |
| Contact Us | `/contact` | Contact form + email address |
| Privacy Policy | `/privacy-policy` | Data collection, cookies, AdSense data-use disclosure |
| Disclaimer | `/disclaimer` | Content accuracy, affiliate/ad disclaimer |
| HTML Sitemap | `/sitemap-page` | All major category links visible to users |

### 6.2 Content Quality Rules

- Minimum **800 words** per detail page (AI summary + original description combined).
- No copied content without substantial transformation.
- Each page must have a **unique title**, **unique meta description**, and **unique H1**.
- Thin pages beyond pagination page 3 get `robots: { index: false }`.
- Minimum **30 quality indexed posts** before applying for AdSense.

### 6.3 AdSense Unit Component

```tsx
// components/ads/AdsenseUnit.tsx
"use client";
import Script from "next/script";

interface Props {
  slot: string;
  format?: "auto" | "fluid" | "rectangle";
  className?: string;
}

export function AdsenseUnit({ slot, format = "auto", className }: Props) {
  return (
    <div className={`min-h-[90px] overflow-hidden ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
      <Script id={`adsense-init-${slot}`} strategy="lazyOnload">
        {`(adsbygoogle = window.adsbygoogle || []).push({});`}
      </Script>
    </div>
  );
}
```

### 6.4 Ad Placement Rules

- Max **3 display ads** per page.
- 1 in-article ad (after 3rd paragraph on detail pages).
- 1 below-the-fold sidebar ad on listing pages.
- 1 in listing page (after 6th card).
- **No ads** on About, Contact, Privacy Policy pages.
- **No ads** above the fold on mobile.

---

## 7. OpenAI Integration Spec

### 7.1 Use Cases

| Feature | Trigger | Model | Output |
|---|---|---|---|
| **Auto Summary** | Page load (server, cached 24h) | gpt-4o-mini | 3-sentence Hindi summary |
| **FAQ Generator** | Page load (server, cached 24h) | gpt-4o-mini | 5 FAQs (schema-ready JSON) |
| **Hindi Translation** | Admin panel button | gpt-4o | English content → Hindi |
| **SEO Title Optimizer** | Admin panel | gpt-4o | 3 SEO title suggestions |
| **Chat Widget** | User click | gpt-4o-mini | Q&A about a specific scheme/job |

### 7.2 OpenAI Client Singleton

```ts
// lib/openai.ts
import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
```

### 7.3 API Route — Auto Summarize

```ts
// app/api/ai/summarize/route.ts
import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";

export async function POST(req: NextRequest) {
  const { content, type } = await req.json(); // type: "job" | "scheme"

  const systemPrompt =
    type === "scheme"
      ? "Tum ek sarkar yojana expert ho. Diye gaye content ka 3 sentence mein Hindi summary likho. Sirf summary likho."
      : "Tum ek sarkari naukri expert ho. Diye gaye job post ka 3 sentence mein Hindi summary likho. Relevant dates aur eligibility zaroor mention karo.";

  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: content.slice(0, 4000) },
    ],
    max_tokens: 200,
    temperature: 0.3,
  });

  return NextResponse.json({ summary: completion.choices[0].message.content });
}
```

### 7.4 API Route — FAQ Generator

```ts
// app/api/ai/faq/route.ts
import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";

export async function POST(req: NextRequest) {
  const { title, content } = await req.json();

  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "Indian government portal ke liye 5 helpful FAQ generate karo. JSON array return karo: [{\"question\": \"...\", \"answer\": \"...\"}]. Sirf JSON return karo, koi extra text nahi.",
      },
      { role: "user", content: `Title: ${title}\n\nContent: ${content.slice(0, 3000)}` },
    ],
    max_tokens: 600,
    temperature: 0.4,
    response_format: { type: "json_object" },
  });

  const data = JSON.parse(completion.choices[0].message.content ?? "{}");
  return NextResponse.json({ faqs: data.faqs ?? [] });
}
```

### 7.5 Caching AI Responses (unstable_cache)

```ts
// Inside a Server Component detail page
import { unstable_cache } from "next/cache";

const getCachedSummary = unstable_cache(
  async (slug: string, content: string) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/ai/summarize`, {
      method: "POST",
      body: JSON.stringify({ content, type: "job" }),
      headers: { "Content-Type": "application/json" },
    });
    return res.json();
  },
  ["ai-summary"],
  { revalidate: 86400, tags: ["ai-summary"] }  // 24-hour cache per slug
);
```

### 7.6 AI Summary Box Component

```tsx
// components/ai/AiSummaryBox.tsx
export function AiSummaryBox({ summary }: { summary: string }) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 my-6">
      <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">
        AI सहायक — Auto Summary
      </p>
      <p className="text-sm text-gray-700 leading-relaxed">{summary}</p>
      <p className="text-[10px] text-gray-400 mt-2">
        AI द्वारा तैयार। कृपया आधिकारिक स्रोत से जाँचें।
      </p>
    </div>
  );
}
```

---

## 8. UI Specification

### 8.1 Design Tokens (tailwind.config.ts)

```ts
colors: {
  brand: {
    DEFAULT: "#1e3a5f",   // deep navy (government feeling)
    light: "#2563eb",
    accent: "#f59e0b",    // amber (CTA, badges)
    muted: "#f1f5f9",
  },
},
fontFamily: {
  sans: ["var(--font-hind)", "var(--font-inter)", "sans-serif"],
},
```

### 8.2 Pages Specification

#### Home Page (`/`)
- **Hero:** Search bar (Jobs / Yojana toggle), "Today's Notifications" marquee ticker
- **Sections:** Latest Jobs (6 cards) · Latest Schemes (6 cards) · Latest Blog (3 cards)
- **Stats bar:** Total Jobs / Schemes / States covered (from `/stats` API)
- **AdSense:** 1 unit below stats bar
- **ISR:** `revalidate: 3600`

#### Job Listing (`/jobs`)
- Sticky filter sidebar: Category, State, Status (Active / Expired)
- 10 cards per page with Pagination component
- Sort options: Latest / Closing Soon
- **AdSense:** After 6th card (in-feed)
- **Structured Data:** `ItemList` with `ListItem` for each card

#### Job Detail (`/jobs/[slug]`)
- Breadcrumb: Home > Jobs > [Category] > [Title]
- H1: Job title with year e.g. "SSC CHSL Recruitment 2026"
- Meta info box: Last Date · Vacancies · Eligibility · Salary · Organization
- **AI Summary Box** (top, above fold)
- Full job description rendered from content field
- **In-Article AdSense** after 3rd paragraph
- Apply button → official URL (rel="nofollow noopener" target="_blank")
- **AI FAQ Section** with FAQPage schema
- Related Jobs (4 cards, same category)
- **Structured Data:** `JobPosting` + `BreadcrumbList` + `FAQPage`
- **ISR:** `revalidate: 3600`

#### Scheme Listing (`/yojana`)
- Filter: State (dropdown), Scheme Type (tabs)
- 12 cards per page
- Indian state quick-nav pills (Bihar, UP, Gujarat, Jharkhand, etc.)
- **ISR:** `revalidate: 86400`

#### Scheme Detail (`/yojana/[slug]`)
- Breadcrumb: Home > Yojana > [State] > [Title]
- H1: Scheme title
- Info box: State · Type · Start Date · Last Date
- Required Documents (styled checklist from `requiredDocs` array)
- **AI Summary Box**
- Full `aboutScheme` text
- Step-by-step process (numbered list from `process` field)
- Apply button → `applyLink`
- **AI FAQ Section**
- Related Schemes (same state/type)
- **Structured Data:** `GovernmentService` + `FAQPage` + `BreadcrumbList`
- **ISR:** `revalidate: 86400`

#### Blog Listing (`/blog`)
- 9 cards per page, 3-column grid on desktop
- Category filter tabs at top

#### Blog Detail (`/blog/[slug]`)
- Article layout, author, publish date, reading time estimate
- Auto-generated Table of Contents (from H2/H3 headings)
- Share buttons (Web Share API + clipboard copy)
- **Structured Data:** `Article` + `BreadcrumbList`

#### Search (`/search`)
- `robots: { index: false, follow: false }` — no crawl value
- Real-time results from `/api/search?q=...`
- Results grouped by type: Jobs | Schemes | Blog

#### Static Pages (About, Contact, Privacy, Disclaimer)
- Clean minimal layout, no ads
- High E-E-A-T signals (team info, org details, policy dates)
- Contact page: name/email/message form

### 8.3 Header Layout

```
[Logo]  [Jobs ▾]  [Yojana ▾]  [Blog]  [States ▾]  [Search Icon]
```
- Dropdown menus for Job Categories and Indian States
- Sticky on scroll with backdrop blur
- Mobile: hamburger → Sheet (shadcn drawer)

### 8.4 Footer Layout

```
About | Contact | Privacy Policy | Disclaimer | Sitemap
© 2026 SarkariAfsar.com — सरकारी खबर, सबसे पहले
State quick links: Bihar · UP · Gujarat · Jharkhand · Maharashtra · Rajasthan...
```

---

## 9. API Map

All calls in `lib/api/` are server-side utilities using `fetch` with Next.js cache tags.

### 9.1 Jobs (`lib/api/jobs.ts`)

```ts
const BASE = `${process.env.NEXT_PUBLIC_API_BASE_URL}/post`;

// GET /post/?page&limit&category&status&search&sortBy&order
export async function getJobs(params: JobsParams): Promise<JobsResponse>

// GET /post/slug/:slug
export async function getJobBySlug(slug: string): Promise<Job>

// GET /post/?category=X&limit=4  (related jobs)
export async function getRelatedJobs(category: string, excludeSlug: string): Promise<Job[]>

// GET /post/ — for sitemap generation (large limit, slug + updatedAt only)
export async function getAllJobSlugs(): Promise<{ slug: string; updatedAt: string }[]>
```

### 9.2 Schemes (`lib/api/schemes.ts`)

```ts
const BASE = `${process.env.NEXT_PUBLIC_API_BASE_URL}/schemes`;

// GET /schemes/?page&limit&state&schemetype&search&sortBy&order
export async function getSchemes(params: SchemesParams): Promise<SchemesResponse>

// GET /schemes/slug/:slug
export async function getSchemeBySlug(slug: string): Promise<Scheme>

// GET /schemes/?limit=1000  (for distinct states)
export async function getSchemeStates(): Promise<string[]>

// GET /schemes/ — for sitemap
export async function getAllSchemeSlugs(): Promise<{ slug: string; updatedAt: string }[]>
```

### 9.3 Blog (`lib/api/blog.ts`)

```ts
const BASE = `${process.env.NEXT_PUBLIC_API_BASE_URL}/blog`;

// GET /blog/?page&limit&category&search
export async function getBlogs(params: BlogParams): Promise<BlogsResponse>

// GET /blog/slug/:slug
export async function getBlogBySlug(slug: string): Promise<Blog>
```

### 9.4 Search (`lib/api/search.ts`)

```ts
const BASE = `${process.env.NEXT_PUBLIC_API_BASE_URL}/search`;

// GET /search?q=...&type=post|scheme|blog&page&limit
export async function globalSearch(query: string, type?: string): Promise<SearchResults>
```

### 9.5 Stats (`lib/api/stats.ts`)

```ts
const BASE = `${process.env.NEXT_PUBLIC_API_BASE_URL}/stats`;

// GET /stats → { totalPosts, totalSchemes, totalBlog, totalStates }
export async function getSiteStats(): Promise<SiteStats>
```

### 9.6 Post Sections (`lib/api/sections.ts`)

```ts
const BASE = `${process.env.NEXT_PUBLIC_API_BASE_URL}/postsection`;

// GET /postsection/?postId=...
export async function getPostSections(postId: string): Promise<PostSection[]>
```

### 9.7 ISR On-Demand Revalidation Webhook

```ts
// app/api/revalidate/route.ts
import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { secret, tag, path } = await req.json();
  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (tag) revalidateTag(tag);
  if (path) revalidatePath(path);
  return NextResponse.json({ revalidated: true, ts: Date.now() });
}
```

Backend calls this endpoint after every new post/scheme is created, then `pingIndexNow()` fires.

---

## 10. Structured Data Templates

### 10.1 JobPosting

```ts
// lib/structuredData.ts
export function buildJobPostingSchema(job: Job) {
  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.shortDesc ?? job.content,
    identifier: { "@type": "PropertyValue", name: "SarkariAfsar", value: job.slug },
    datePosted: job.createdAt,
    validThrough: job.applyLastDate,
    employmentType: "FULL_TIME",
    hiringOrganization: {
      "@type": "Organization",
      name: job.organization ?? "Government of India",
      sameAs: "https://sarkariafsar.com",
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressCountry: "IN",
        addressRegion: job.state ?? "India",
      },
    },
    url: `https://sarkariafsar.com/jobs/${job.slug}`,
  };
}
```

### 10.2 GovernmentService

```ts
export function buildGovernmentServiceSchema(scheme: Scheme) {
  return {
    "@context": "https://schema.org",
    "@type": "GovernmentService",
    name: scheme.schemeTitle,
    description: scheme.aboutScheme,
    serviceType: scheme.schemetype,
    provider: {
      "@type": "GovernmentOrganization",
      name: `Government of ${scheme.state}`,
    },
    areaServed: { "@type": "State", name: scheme.state },
    url: scheme.applyLink,
    termsOfService: `https://sarkariafsar.com/yojana/${scheme.slug}`,
  };
}
```

### 10.3 FAQPage

```ts
export function buildFaqSchema(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}
```

### 10.4 BreadcrumbList

```ts
export function buildBreadcrumbSchema(crumbs: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };
}
```

### 10.5 SiteLinksSearchBox (in Root layout.tsx)

```ts
export const siteLinksSearchBoxSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  url: "https://sarkariafsar.com/",
  name: "Sarkari Afsar",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://sarkariafsar.com/search?q={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
};
```

### 10.6 JSON-LD Injector Component

```tsx
// components/seo/JsonLd.tsx
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
```

---

## 11. Sitemap & Robots

### 11.1 Root Sitemap (`app/sitemap.ts`)

```ts
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://sarkariafsar.com", lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: "https://sarkariafsar.com/jobs", lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: "https://sarkariafsar.com/yojana", lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: "https://sarkariafsar.com/blog", lastModified: new Date(), changeFrequency: "daily", priority: 0.7 },
    { url: "https://sarkariafsar.com/about", changeFrequency: "yearly", priority: 0.3 },
    { url: "https://sarkariafsar.com/contact", changeFrequency: "yearly", priority: 0.3 },
  ];
}
```

Dynamic job and scheme URLs go in separate sitemap chunks (`app/(jobs)/jobs/sitemap.ts`) — each fetches all slugs from the API with a large limit and exports up to 50,000 URLs per chunk.

### 11.2 Robots.txt (`app/robots.ts`)

```ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/api/", "/search", "/admin"] },
      { userAgent: "Googlebot", allow: "/", disallow: ["/api/"] },
    ],
    sitemap: "https://sarkariafsar.com/sitemap.xml",
    host: "https://sarkariafsar.com",
  };
}
```

---

## 12. Dependency Manifest

```json
{
  "name": "sarkariafsar-frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbo",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^14.2.29",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "openai": "^4.57.0",
    "tailwindcss": "^3.4.14",
    "tailwind-merge": "^2.5.4",
    "clsx": "^2.1.1",
    "zustand": "^5.0.0",
    "lucide-react": "^0.447.0",
    "@radix-ui/react-dialog": "^1.1.2",
    "@radix-ui/react-dropdown-menu": "^2.1.2",
    "@radix-ui/react-tabs": "^1.1.1",
    "@radix-ui/react-toast": "^1.2.2",
    "@next/third-parties": "^14.2.29",
    "class-variance-authority": "^0.7.0"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "typescript": "^5",
    "eslint": "^8",
    "eslint-config-next": "^14",
    "autoprefixer": "^10",
    "postcss": "^8"
  }
}
```

---

## Quick Start Commands

```bash
# 1. Create Next.js app
npx create-next-app@latest sarkariafsar-frontend --typescript --tailwind --app

# 2. Install extra dependencies
cd sarkariafsar-frontend
npm install openai zustand lucide-react class-variance-authority clsx tailwind-merge @next/third-parties
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-tabs @radix-ui/react-toast

# 3. Init shadcn/ui
npx shadcn@latest init

# 4. Set up environment
cp .env.example .env.local
# Fill: NEXT_PUBLIC_API_BASE_URL, OPENAI_API_KEY, NEXT_PUBLIC_GA4_ID, NEXT_PUBLIC_ADSENSE_CLIENT

# 5. Run dev server
npm run dev
```

---

## AdSense Apply Checklist — Do This Before Applying

```
[ ] 30+ quality indexed pages live
[ ] About / Contact / Privacy Policy / Disclaimer pages published
[ ] Custom domain with HTTPS active (not localhost/vercel.app)
[ ] LCP < 2.5s — verified in PageSpeed Insights (mobile)
[ ] No copyrighted or thin (<300 word) content indexed
[ ] No broken links (run Screaming Frog or Ahrefs Site Audit)
[ ] Google Search Console verified, sitemap submitted
[ ] Privacy Policy mentions Google AdSense and cookie usage
[ ] AdSense auto-ads script added to root layout BEFORE applying
[ ] Site has navigation menu and footer on every page
```
