import { NextResponse } from "next/server";

const MAX_LIMIT = 200;

function normalizeBaseUrl(value) {
  return String(value || "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/\/+$/, "");
}

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
  const { searchParams } = new URL(request.url);

  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(searchParams.get("limit") || 20)));
  const megaSlug = String(searchParams.get("megaSlug") || "latest-gov-jobs").trim();

  const baseUrl = normalizeBaseUrl(process.env.BASE_URL);
  if (!baseUrl) {
    return NextResponse.json(
      {
        success: false,
        message: "BASE_URL is not configured",
      },
      { status: 500 },
    );
  }

  const upstreamParams = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    megaSlug,
  });

  const upstreamUrl = `${baseUrl}/site/favorite-jobs?${upstreamParams.toString()}`;

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
      return NextResponse.json(
        {
          success: false,
          message: "Invalid response from upstream service",
          upstream: {
            status: response.status,
            contentType: response.headers.get("content-type") || "unknown",
            url: upstreamUrl,
          },
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
