import { baseUrl } from "@/app/lib/baseUrl";
import { withApiJsonCache } from "@/app/lib/apiCache";
import { NextResponse } from "next/server";

const CACHE_NAMESPACE = "post-details-by-canonicalkey";
const CACHE_TTL_MS = 2 * 60 * 1000;

function normalizeBaseUrl(value) {
  return String(value || "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/\/+$/, "");
}

async function parseJsonFromResponse(response) {
  const text = await response.text().catch(() => "");
  if (!text) return { payload: null, text: "" };

  try {
    return { payload: JSON.parse(text), text };
  } catch {
    return { payload: null, text };
  }
}

function buildBodyPreview(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 240);
}

function shouldRetry(response, payload) {
  if (payload) return false;
  if (!response) return true;
  if (response.status >= 500 || response.status === 429) return true;
  const contentType = String(response.headers.get("content-type") || "").toLowerCase();
  return contentType.includes("text/html");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchUpstreamPostDetails({ canonicalKey, upstreamUrl, attempts = 2 }) {
  let lastResult = null;
  let lastError = null;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(upstreamUrl, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ canonicalKey }),
        cache: "no-store",
      });

      const { payload, text } = await parseJsonFromResponse(response);
      lastResult = { response, payload, text, attempt };
      if (payload) return lastResult;

      if (!shouldRetry(response, payload) || attempt >= attempts) break;
      await sleep(200 * attempt);
    } catch (error) {
      lastError = error;
      if (attempt >= attempts) throw error;
      await sleep(200 * attempt);
    }
  }

  if (!lastResult && lastError) throw lastError;
  return lastResult;
}

export async function POST(request) {
  let body = null;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid JSON body",
      },
      { status: 400 },
    );
  }

  const canonicalKey = String(body?.canonicalKey || "").trim();
  if (!canonicalKey) {
    return NextResponse.json(
      {
        success: false,
        message: "canonicalKey is required",
      },
      { status: 400 },
    );
  }
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  const upstreamUrl = `${normalizedBaseUrl}/post/scrape`;

  return withApiJsonCache({
    namespace: CACHE_NAMESPACE,
    keyParts: { canonicalKey },
    ttlMs: CACHE_TTL_MS,
    loader: async () => {
      try {
        const { response, payload, text, attempt } = await fetchUpstreamPostDetails({
          canonicalKey,
          upstreamUrl,
          attempts: 2,
        });

        if (!payload) {
          return {
            status: 502,
            cacheable: false,
            payload: {
              success: false,
              message: "Upstream service returned an unreadable response",
              upstream: {
                status: Number(response?.status || 502),
                contentType: response?.headers?.get("content-type") || "unknown",
                url: upstreamUrl,
                attempt,
                bodyPreview: buildBodyPreview(text),
              },
            },
          };
        }

        return {
          status: response.status,
          payload,
        };
      } catch {
        return {
          status: 502,
          cacheable: false,
          payload: {
            success: false,
            message: "Failed to connect to upstream service",
          },
        };
      }
    },
  });
}
