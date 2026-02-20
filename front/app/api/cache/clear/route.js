import { clearApiCache, getApiCacheStats } from "@/app/lib/apiCache";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function readToken(request) {
  const auth = String(request.headers.get("authorization") || "").trim();
  if (auth.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim();
  }
  return String(request.headers.get("x-cache-token") || "").trim();
}

function isAuthorized(request) {
  const expected = String(process.env.API_CACHE_CLEAR_TOKEN || "").trim();
  if (!expected) return true;
  const received = readToken(request);
  return received === expected;
}

function normalizeNamespace(value) {
  return String(value || "").trim();
}

export async function POST(request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        success: false,
        message: "Unauthorized",
      },
      { status: 401 },
    );
  }

  const url = new URL(request.url);
  const body = await request.json().catch(() => ({}));
  const namespace = normalizeNamespace(
    body?.namespace || url.searchParams.get("namespace"),
  );

  const before = getApiCacheStats();
  const cleared = clearApiCache({ namespace });
  const after = getApiCacheStats();

  return NextResponse.json(
    {
      success: true,
      message: namespace
        ? `Cache cleared for namespace "${namespace}"`
        : "Cache cleared for all namespaces",
      namespace: namespace || "all",
      cleared,
      before,
      after,
    },
    { status: 200 },
  );
}

