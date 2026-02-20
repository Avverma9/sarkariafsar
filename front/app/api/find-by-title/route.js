import { baseUrl } from "@/app/lib/baseUrl";
import { withApiJsonCache } from "@/app/lib/apiCache";
import { NextResponse } from "next/server";

const CACHE_NAMESPACE = "find-by-title";
const CACHE_TTL_MS = 30 * 1000;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const search = new URL(request.url).search;

  const title = String(searchParams.get("title") || "").trim();

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
