import { notFound } from "next/navigation";
import Header from "../../components/header";
import Footer from "../../components/footer";
import PostContent from "../../components/PostContent";
import { baseUrl } from "../../../lib/baseUrl";
import createDOMPurify from "isomorphic-dompurify";

// ─── Constants ────────────────────────────────────────────────────────────────
const FETCH_TIMEOUT_MS = 8_000;
const REVALIDATE_SECONDS = 60;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";
const FALLBACK_AUTHOR = "SarkariAfsar Editorial";
const FALLBACK_DESCRIPTION = "Latest government jobs, admit cards, results and scheme updates — SarkariAfsar.";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Resolve a possibly-relative image URL to absolute. */
function resolveImageUrl(raw) {
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (!SITE_URL) return null;
  return SITE_URL + (raw.startsWith("/") ? raw : `/${raw}`);
}

/** Fetch a post by slug. Returns null on 404, throws on other errors. */
async function fetchPost(slug) {
  const url = `${baseUrl}/post/slug/${encodeURIComponent(slug)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      next: { revalidate: REVALIDATE_SECONDS },
    });

    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Upstream error ${res.status} for slug "${slug}"`);

    const json = await res.json();
    const raw = json?.data ?? json;
    return Array.isArray(raw) ? (raw[0] ?? null) : raw ?? null;
  } catch (err) {
    if (err?.name === "AbortError") {
      console.warn(`[PostDetail] Fetch timed out for slug: ${slug}`);
      return null;
    }
    console.error(`[PostDetail] Fetch failed for slug "${slug}":`, err?.message ?? err);
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/** Sanitize raw HTML. Falls back to a naive script-strip on DOMPurify failure. */
function sanitize(rawHtml = "") {
  if (!rawHtml) return "";
  try {
    return createDOMPurify().sanitize(rawHtml, {
      ADD_ATTR: ["target", "rel"],
      FORBID_TAGS: ["script", "style", "iframe", "form", "input", "button"],
      FORBID_ATTR: ["onerror", "onload", "onclick"],
    });
  } catch {
    return rawHtml.replace(/<script[\s\S]*?<\/script>/gi, "");
  }
}

/** Build derived SEO strings from a post object. */
function buildSeo(post, slug, sanitizedHtml) {
  const plainText = sanitizedHtml.replace(/<[^>]+>/g, "").trim();
  const title =
    post?.title ||
    post?.heading ||
    (post?.sectionName ? `${post.sectionName} — SarkariAfsar` : "SarkariAfsar Update");

  const description =
    (post?.excerpt || post?.intro || plainText.slice(0, 160) || FALLBACK_DESCRIPTION).slice(0, 160);

  const author  = post?.author || post?.source || FALLBACK_AUTHOR;
  const published = post?.publishedAt || post?.createdAt || new Date().toISOString();
  const modified  = post?.updatedAt || published;
  const canonical = `${SITE_URL}/post/${slug}`;

  const imageUrl = resolveImageUrl(
    post?.featuredImage || post?.image || post?.ogImage ||
    post?.thumbnail    || post?.images?.[0]
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    author: { "@type": "Person", name: author },
    datePublished: published,
    dateModified: modified,
    publisher: {
      "@type": "Organization",
      name: "SarkariAfsar",
      logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` },
    },
    url: canonical,
    ...(imageUrl && { image: imageUrl }),
  };

  return { title, description, author, published, canonical, imageUrl, jsonLd };
}

// ─── generateMetadata (App Router) ────────────────────────────────────────────
// If you're on Next.js App Router, export this instead of using <Head>.
export async function generateMetadata({ params }) {
  const { slug: rawSlug } = await params;
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;

  let post = null;
  try { post = await fetchPost(slug); } catch { /* graceful fallback */ }

  const html  = sanitize(post?.scrapedContent?.contentHtml ?? post?.contentHtml);
  const { title, description, canonical, imageUrl } = buildSeo(post, slug, html);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "article",
      ...(imageUrl && { images: [{ url: imageUrl }] }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(imageUrl && { images: [imageUrl] }),
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function PostDetailPage({ params }) {
  // Next.js 15+: params is a Promise
  const { slug: rawSlug } = await params;
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;

  if (!slug) notFound();

  // Fetch & sanitize
  let post = null;
  try {
    post = await fetchPost(slug);
  } catch {
    // Server error — still render the shell; PostContent handles the retry
  }

  if (post === null) notFound();

  const rawHtml      = post?.scrapedContent?.contentHtml ?? post?.contentHtml ?? "";
  const sanitizedHtml = sanitize(rawHtml);
  const seo          = buildSeo(post, slug, sanitizedHtml);

  return (
    <>
      <Header />

      <main>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(seo.jsonLd) }}
        />
        <PostContent
          slug={slug}
          initialPost={post}
          initialHtml={sanitizedHtml}
          shareUrl={seo.canonical}
        />
      </main>

      <Footer />
    </>
  );
}