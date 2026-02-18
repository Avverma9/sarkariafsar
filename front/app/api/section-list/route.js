import { NextResponse } from "next/server";

function normalizeBaseUrl(value) {
  return String(value || "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/\/+$/, "");
}

export async function GET() {
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

  const upstreamUrl = `${baseUrl}/site/mega-sections`;

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
