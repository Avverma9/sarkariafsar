import { baseUrl } from "@/app/lib/baseUrl";
import { withApiJsonCache } from "@/app/lib/apiCache";
import { NextResponse } from "next/server";

const MAX_LIMIT = 200;
const CACHE_NAMESPACE = "postlist-by-section";
const CACHE_TTL_MS = 60 * 1000;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const search = new URL(request.url).search;

  const megaTitle = String(searchParams.get("megaTitle") || "").trim();
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(searchParams.get("limit") || 100)));

  if (!megaTitle) {
    return NextResponse.json(
      {
        success: false,
        message: "megaTitle is required",
      },
      { status: 400 },
    );
  }

  const upstreamParams = new URLSearchParams(searchParams);
  upstreamParams.set("megaTitle", megaTitle);
  upstreamParams.set("page", String(page));
  upstreamParams.set("limit", String(limit));

  const upstreamUrl = `${baseUrl}/site/post-list-by-section-url?${upstreamParams.toString()}`;

  return withApiJsonCache({
    namespace: CACHE_NAMESPACE,
    keyParts: { search },
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
