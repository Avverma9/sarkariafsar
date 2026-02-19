import { baseUrl } from "@/app/lib/baseUrl";
import { NextResponse } from "next/server";

const MAX_LIMIT = 200;

function normalizeBaseUrl(value) {
  return String(value || "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/\/+$/, "");
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const title = String(searchParams.get("title") || "").trim();
  const megaSlug = String(searchParams.get("megaSlug") || "").trim();
  const sectionUrl = String(searchParams.get("sectionUrl") || "").trim();
  const exactRaw = String(searchParams.get("exact") || "").trim().toLowerCase();
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(searchParams.get("limit") || 20)));

  if (!title) {
    return NextResponse.json(
      {
        success: false,
        message: "title is required",
      },
      { status: 400 },
    );
  }

  const upstreamParams = new URLSearchParams({
    title,
    page: String(page),
    limit: String(limit),
  });

  if (megaSlug) upstreamParams.set("megaSlug", megaSlug);
  if (sectionUrl) upstreamParams.set("sectionUrl", sectionUrl);
  if (exactRaw) upstreamParams.set("exact", exactRaw === "true" ? "true" : "false");

  const upstreamUrl = `${baseUrl}/site/find-by-title?${upstreamParams.toString()}`;

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
      return NextResponse.json(
        {
          success: false,
          message: "Invalid response from upstream service",
        },
        { status: 502 },
      );
    }

    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to connect to upstream service",
      },
      { status: 502 },
    );
  }
}
