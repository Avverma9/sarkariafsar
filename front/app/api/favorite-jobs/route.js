import { baseUrl } from "@/app/lib/baseUrl";
import { withApiJsonCache } from "@/app/lib/apiCache";
import { NextResponse } from "next/server";

const CACHE_NAMESPACE = "favorite-jobs";
const CACHE_TTL_MS = 60 * 1000;

async function parseJsonFromResponse(response) {
  const text = await response.text().catch(() => "");
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function GET(request) {
  const search = new URL(request.url).search;
  const upstreamUrl = `${baseUrl}/site/favorite-jobs${search}`;

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

        const payload = await parseJsonFromResponse(response);
        if (!payload) {
          return {
            status: 502,
            cacheable: false,
            payload: {
              success: false,
              message: "Invalid response from upstream service",
              upstream: {
                status: response.status,
                contentType: response.headers.get("content-type") || "unknown",
                url: upstreamUrl,
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
