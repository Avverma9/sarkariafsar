import { baseUrl } from "@/app/lib/baseUrl";
import { withApiJsonCache } from "@/app/lib/apiCache";
import { NextResponse } from "next/server";

const CACHE_NAMESPACE = "find-by-title";
const CACHE_TTL_MS = 30 * 1000;
const MAX_LIMIT = 10000;
const DEFAULT_LIMIT = 20;

function parsePositiveInt(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

function normalizeFindByTitleParams(searchParams) {
  const title = String(searchParams.get("title") || "").trim();
  const page = parsePositiveInt(searchParams.get("page"), 1);
  const limit = Math.min(MAX_LIMIT, parsePositiveInt(searchParams.get("limit"), DEFAULT_LIMIT));

  const params = new URLSearchParams();
  params.set("title", title);
  params.set("page", String(page));
  params.set("limit", String(limit));

  return {
    title,
    page,
    limit,
    search: `?${params.toString()}`,
  };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const normalized = normalizeFindByTitleParams(searchParams);
  const { title, page, limit, search } = normalized;

  if (!title) {
    return NextResponse.json(
      {
        success: false,
        message: "title is required",
      },
      { status: 400 },
    );
  }

  const upstreamUrl = `${baseUrl}/site/find-by-title${search}`;

  return withApiJsonCache({
    namespace: CACHE_NAMESPACE,
    keyParts: { title, page, limit },
    ttlMs: CACHE_TTL_MS,
    loader: async () => {
      try {
        const response = await fetch(upstreamUrl, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          cache: "no-store",
        });

        const payload = await response.json().catch(() => null);
        if (!payload) {
          return {
            status: 502,
            cacheable: false,
            payload: {
              success: false,
              message: "Invalid response from upstream service",
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
