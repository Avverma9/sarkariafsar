import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { ALL_CACHE_TAGS } from "../lib/cacheConfig";

const SECRET = process.env.API_CACHE_CLEAR_TOKEN || "";
export const dynamic = "force-dynamic";

function jsonResponse(payload, init = {}) {
  const response = NextResponse.json(payload, init);
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  response.headers.set("Cache-Control", "no-store, max-age=0");
  return response;
}

export async function POST(request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "") || "";

  if (!SECRET || token !== SECRET) {
    return jsonResponse({ error: "Unauthorized" }, { status: 401 });
  }

  let tag = null;
  try {
    const body = await request.json();
    tag = body?.tag || null;
  } catch {
    // no body or invalid JSON — revalidate all
  }

  if (tag) {
    revalidateTag(tag);
    return jsonResponse({ revalidated: true, tag, time: new Date().toISOString() });
  }

  ALL_CACHE_TAGS.forEach(revalidateTag);
  return jsonResponse({
    revalidated: true,
    tags: ALL_CACHE_TAGS,
    time: new Date().toISOString(),
  });
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  if (!SECRET || secret !== SECRET) {
    return jsonResponse({ error: "Unauthorized" }, { status: 401 });
  }

  const tag = searchParams.get("tag") || null;

  if (tag) {
    revalidateTag(tag);
    return jsonResponse({ revalidated: true, tag, time: new Date().toISOString() });
  }

  ALL_CACHE_TAGS.forEach(revalidateTag);
  return jsonResponse({
    revalidated: true,
    tags: ALL_CACHE_TAGS,
    time: new Date().toISOString(),
  });
}
