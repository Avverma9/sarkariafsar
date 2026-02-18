export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

const ALLOWED_PDF_HOSTS = ["sarkariresult.com.cm", "sarkariexam.com", "rojgarresult.com"];
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";

function parseUrl(url) {
  try {
    return new URL(String(url || "").trim());
  } catch {
    return null;
  }
}

function isHttpUrl(urlObj) {
  return Boolean(urlObj) && (urlObj.protocol === "http:" || urlObj.protocol === "https:");
}

function isAllowedHost(hostname) {
  const host = String(hostname || "").toLowerCase();
  return ALLOWED_PDF_HOSTS.some(
    (allowed) => host === allowed || host === `www.${allowed}` || host.endsWith(`.${allowed}`),
  );
}

function upgradeToHttpsIfPossible(urlObj) {
  try {
    const u = new URL(urlObj.toString());
    if (u.protocol === "http:") u.protocol = "https:";
    return u.toString();
  } catch {
    return String(urlObj || "");
  }
}

function toReferer(url) {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}/`;
  } catch {
    return "";
  }
}

function isPdfResponse(contentType, urlObj, contentDisposition = "") {
  const type = String(contentType || "").toLowerCase();
  const disposition = String(contentDisposition || "").toLowerCase();
  const pathLooksPdf = String(urlObj?.pathname || "").toLowerCase().endsWith(".pdf");

  if (type.includes("application/pdf")) return true;
  if (pathLooksPdf) return true;
  return disposition.includes(".pdf");
}

function getFilename(urlObj) {
  const pathname = String(urlObj?.pathname || "");
  const last = pathname.split("/").pop() || "";
  const cleaned = last.replace(/"/g, "").trim();
  return cleaned || "document.pdf";
}

async function checkPdfTarget(target) {
  const referer = toReferer(target);
  const commonHeaders = {
    "User-Agent": UA,
    Accept: "application/pdf,application/octet-stream;q=0.9,*/*;q=0.8",
    ...(referer ? { Referer: referer } : {}),
  };

  let upstream;
  try {
    upstream = await fetch(target, {
      method: "HEAD",
      redirect: "follow",
      cache: "no-store",
      headers: commonHeaders,
    });

    if (upstream.status === 405 || upstream.status === 501) {
      upstream = await fetch(target, {
        method: "GET",
        redirect: "follow",
        cache: "no-store",
        headers: {
          ...commonHeaders,
          Range: "bytes=0-0",
        },
      });
    }
  } catch (error) {
    return {
      success: false,
      status: 502,
      message: "Upstream check failed",
      error: String(error?.message || error),
    };
  }

  if (!upstream.ok && upstream.status !== 206) {
    const result = {
      success: false,
      status: 502,
      message: `Upstream error ${upstream.status}`,
    };
    upstream.body?.cancel?.();
    return result;
  }

  const finalUrl = parseUrl(upstream.url);
  if (finalUrl && !isAllowedHost(finalUrl.hostname)) {
    upstream.body?.cancel?.();
    return {
      success: false,
      status: 403,
      message: "Redirected to a disallowed host",
    };
  }

  const contentType = upstream.headers.get("content-type") || "";
  const contentDisposition = upstream.headers.get("content-disposition") || "";
  if (!isPdfResponse(contentType, finalUrl || parseUrl(target), contentDisposition)) {
    upstream.body?.cancel?.();
    return {
      success: false,
      status: 415,
      message: "Target URL is not a PDF",
    };
  }

  upstream.body?.cancel?.();

  return {
    success: true,
    status: 200,
    redirected: Boolean(upstream.redirected),
    finalUrl: finalUrl?.toString() || target,
  };
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const mode = String(searchParams.get("mode") || "").toLowerCase();
  const wantsDownload = String(searchParams.get("download") || "") === "1";

  const rawTarget = String(searchParams.get("url") || "").trim();
  const parsedTarget = parseUrl(rawTarget);

  if (!parsedTarget || !isHttpUrl(parsedTarget)) {
    return NextResponse.json(
      { success: false, message: "Valid url is required" },
      { status: 400 },
    );
  }

  if (!isAllowedHost(parsedTarget.hostname)) {
    return NextResponse.json(
      { success: false, message: "Target host is not allowed" },
      { status: 403 },
    );
  }

  const target = upgradeToHttpsIfPossible(parsedTarget);

  if (mode === "check") {
    const check = await checkPdfTarget(target);
    if (!check.success) {
      return NextResponse.json(
        {
          success: false,
          message: check.message,
          ...(check.error ? { error: check.error } : {}),
        },
        { status: check.status },
      );
    }
    return NextResponse.json(
      {
        success: true,
        redirected: check.redirected,
        finalUrl: check.finalUrl,
      },
      { status: 200 },
    );
  }

  const range = req.headers.get("range") || "";
  const referer = toReferer(target);

  let upstream;
  try {
    upstream = await fetch(target, {
      redirect: "follow",
      cache: "no-store",
      headers: {
        "User-Agent": UA,
        Accept: "application/pdf,application/octet-stream;q=0.9,*/*;q=0.8",
        ...(range ? { Range: range } : {}),
        ...(referer ? { Referer: referer } : {}),
      },
    });
  } catch (e) {
    return NextResponse.json(
      {
        success: false,
        message: "Upstream fetch failed",
        error: String(e?.message || e),
      },
      { status: 502 },
    );
  }

  if (!upstream.ok && upstream.status !== 206) {
    let txt = "";
    try {
      txt = (await upstream.text()).slice(0, 400);
    } catch {}
    return NextResponse.json(
      {
        success: false,
        message: `Upstream error ${upstream.status}`,
        details: txt,
      },
      { status: 502 },
    );
  }

  const finalUrl = parseUrl(upstream.url) || parseUrl(target);
  if (finalUrl && !isAllowedHost(finalUrl.hostname)) {
    return NextResponse.json(
      { success: false, message: "Redirected to a disallowed host" },
      { status: 403 },
    );
  }

  const headers = new Headers();
  const ct = upstream.headers.get("content-type") || "";
  const contentDisposition = upstream.headers.get("content-disposition") || "";

  if (!isPdfResponse(ct, finalUrl, contentDisposition)) {
    return NextResponse.json(
      { success: false, message: "Upstream did not return a PDF file" },
      { status: 415 },
    );
  }

  headers.set("Content-Type", ct.includes("pdf") ? ct : "application/pdf");
  const filename = getFilename(finalUrl);
  headers.set(
    "Content-Disposition",
    `${wantsDownload ? "attachment" : "inline"}; filename="${filename}"`,
  );
  headers.set("Cache-Control", "no-store, max-age=0");

  const acceptRanges = upstream.headers.get("accept-ranges");
  const contentRange = upstream.headers.get("content-range");
  const contentLength = upstream.headers.get("content-length");

  headers.set("Accept-Ranges", acceptRanges || "bytes");
  if (contentRange) headers.set("Content-Range", contentRange);
  if (contentLength) headers.set("Content-Length", contentLength);

  headers.set("Access-Control-Allow-Origin", "*");
  headers.set(
    "Access-Control-Expose-Headers",
    "Accept-Ranges, Content-Range, Content-Length",
  );

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers,
  });
}
