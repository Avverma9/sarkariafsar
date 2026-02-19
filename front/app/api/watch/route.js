export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { baseUrl } from "@/app/lib/baseUrl";
import { NextResponse } from "next/server";

function normalizeBaseUrl(value) {
  return String(value || "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/\/+$/, "");
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeIdentifier(value) {
  if (typeof value === "string") return value.trim();
  if (value && typeof value === "object") {
    const oid = String(value.$oid || value.oid || value.id || value._id || "").trim();
    if (oid) return oid;
  }
  return "";
}

function normalizeText(value) {
  return String(value || "").trim();
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
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

  const email = normalizeEmail(body?.email);
  const postId = normalizeIdentifier(body?.postId);
  const postDetailId = normalizeIdentifier(body?.postDetailId);
  const megaPostId = normalizeIdentifier(body?.megaPostId);
  const canonicalKey = normalizeText(body?.canonicalKey);
  const megaSlug = normalizeText(body?.megaSlug);

  if (!email || !isValidEmail(email)) {
    return NextResponse.json(
      {
        success: false,
        message: "Valid email is required",
      },
      { status: 400 },
    );
  }

  if (!postId && !postDetailId && !megaPostId && !canonicalKey) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Any one identifier is required: postId, postDetailId, megaPostId, or canonicalKey",
      },
      { status: 400 },
    );
  }


  const upstreamUrl = `${baseUrl}/watch`;
  const watchPayload = {
    email,
    enabled: true,
    priority: 10,
    channels: {
      email: true,
      whatsapp: false,
    },
    ...(postId ? { postId } : {}),
    ...(postDetailId ? { postDetailId } : {}),
    ...(megaPostId ? { megaPostId } : {}),
    ...(canonicalKey ? { canonicalKey } : {}),
    ...(megaSlug ? { megaSlug } : {}),
  };

  try {
    const response = await fetch(upstreamUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(watchPayload),
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
