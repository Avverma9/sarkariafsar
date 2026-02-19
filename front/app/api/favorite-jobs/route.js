import { baseUrl } from "@/app/lib/baseUrl";
import { NextResponse } from "next/server";

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
  const upstreamUrl = `${baseUrl}/site/favorite-jobs${new URL(request.url).search}`;

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
