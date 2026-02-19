import { baseUrl } from "@/app/lib/baseUrl";
import { NextResponse } from "next/server";

function normalizeBaseUrl(value) {
  return String(value || "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/\/+$/, "");
}

export async function POST(request) {
  let body = null;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid JSON body",
      },
      { status: 400 },
    );
  }

  const canonicalKey = String(body?.canonicalKey || "").trim();
  if (!canonicalKey) {
    return NextResponse.json(
      {
        success: false,
        message: "canonicalKey is required",
      },
      { status: 400 },
    );
  }


  try {
    const response = await fetch(`${baseUrl}/post/scrape`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ canonicalKey }),
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
