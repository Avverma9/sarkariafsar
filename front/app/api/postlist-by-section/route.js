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

  const baseUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_BASE_URL);
  if (!baseUrl) {
    return NextResponse.json(
      {
        success: false,
        message: "NEXT_PUBLIC_BASE_URL is not configured",
      },
      { status: 500 },
    );
  }

  const upstreamParams = new URLSearchParams({
    megaTitle,
    page: String(page),
    limit: String(limit),
  });

  const upstreamUrl = `${baseUrl}/site/post-list-by-section-url?${upstreamParams.toString()}`;

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
