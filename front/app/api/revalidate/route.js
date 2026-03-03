import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { ALL_CACHE_TAGS } from "../../lib/cacheConfig";

const SECRET = process.env.API_CACHE_CLEAR_TOKEN || "";

export async function POST(request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "") || "";

  if (!SECRET || token !== SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    return NextResponse.json({ revalidated: true, tag, time: new Date().toISOString() });
  }

  // Revalidate all known cache tags
  ALL_CACHE_TAGS.forEach(revalidateTag);
  return NextResponse.json({
    revalidated: true,
    tags: ALL_CACHE_TAGS,
    time: new Date().toISOString(),
  });
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  if (!SECRET || secret !== SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tag = searchParams.get("tag") || null;

  if (tag) {
    revalidateTag(tag);
    return NextResponse.json({ revalidated: true, tag, time: new Date().toISOString() });
  }

  ALL_CACHE_TAGS.forEach(revalidateTag);
  return NextResponse.json({
    revalidated: true,
    tags: ALL_CACHE_TAGS,
    time: new Date().toISOString(),
  });
}
