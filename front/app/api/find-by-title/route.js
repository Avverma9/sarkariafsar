import { baseUrl } from "@/app/lib/baseUrl";
import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const title = String(searchParams.get("title") || "").trim();

  if (!title) {
    return NextResponse.json(
      {
        success: false,
        message: "title is required",
      },
      { status: 400 },
    );
  }

  const upstreamUrl = `${baseUrl}/site/find-by-title${new URL(request.url).search}`;

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
