"use client";

function normalizeBaseUrl(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

export function buildPublicApiUrl(pathname = "") {
  const base = normalizeBaseUrl(process.env.NEXT_PUBLIC_BASE_URL || "");
  const path = String(pathname || "").trim();
  if (!base || !path) return "";
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function shouldFallbackToUpstream(response, payload) {
  if (response.status === 404) return true;
  if (!response.ok) return true;
  if (!payload) return true;
  if (payload?.success === false) return true;
  return false;
}

export async function fetchJsonWithFallback({
  localUrl = "",
  fallbackUrl = "",
  init = {},
  shouldFallback = shouldFallbackToUpstream,
}) {
  let response = await fetch(localUrl, init);
  let payload = await response.json().catch(() => null);

  if (fallbackUrl && shouldFallback(response, payload)) {
    response = await fetch(fallbackUrl, init);
    payload = await response.json().catch(() => null);
  }

  return { response, payload };
}

