import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

const CACHE_CLEAR_TOKEN =
  process.env.API_CACHE_CLEAR_TOKEN ||
  process.env.FRONT_API_CACHE_CLEAR_TOKEN ||
  process.env.CACHE_SECRET ||
  "";

const DEFAULT_REVALIDATE_PATHS = [
  "/",
  "/jobs",
  "/post",
  "/results",
  "/admit-cards",
  "/schemes",
];

const TAG_TO_PATHS = {
  "job-lists": ["/", "/jobs", "/post"],
  "job-details": ["/", "/post"],
  "job-sections": ["/", "/jobs", "/post"],
  sites: ["/"],
  "gov-schemes": ["/", "/schemes"],
};

const toArray = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || "").trim())
      .filter(Boolean);
  }

  const text = String(value || "").trim();
  if (!text) return [];

  return text
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const toUniqueArray = (values = []) => {
  const output = [];
  const seen = new Set();

  for (const value of values || []) {
    const cleanValue = String(value || "").trim();
    if (!cleanValue || seen.has(cleanValue)) continue;
    seen.add(cleanValue);
    output.push(cleanValue);
  }

  return output;
};

const getBearerToken = (request) => {
  const header = String(request.headers.get("authorization") || "").trim();
  if (!header.toLowerCase().startsWith("bearer ")) return "";
  return header.slice(7).trim();
};

export async function POST(request) {
  if (!CACHE_CLEAR_TOKEN) {
    return NextResponse.json(
      {
        success: false,
        message: "Cache clear token is not configured",
      },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const providedToken = getBearerToken(request) || String(body?.token || "").trim();

  if (providedToken !== CACHE_CLEAR_TOKEN) {
    return NextResponse.json(
      {
        success: false,
        message: "Unauthorized revalidate request",
      },
      { status: 401 }
    );
  }

  const tags = toUniqueArray([
    ...toArray(body?.tag),
    ...toArray(body?.tags),
  ]);
  const explicitPaths = toUniqueArray([
    ...toArray(body?.path),
    ...toArray(body?.paths),
  ]);
  const derivedPaths = toUniqueArray(
    tags.flatMap((tag) => TAG_TO_PATHS[String(tag || "").trim()] || [])
  );
  const paths =
    explicitPaths.length > 0 || derivedPaths.length > 0
      ? toUniqueArray([...explicitPaths, ...derivedPaths])
      : DEFAULT_REVALIDATE_PATHS;

  for (const tag of tags) {
    revalidateTag(tag);
  }

  for (const path of paths) {
    revalidatePath(path);
  }

  return NextResponse.json({
    success: true,
    revalidated: true,
    tags,
    paths,
    timestamp: new Date().toISOString(),
  });
}
