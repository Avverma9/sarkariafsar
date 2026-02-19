import { NextResponse } from "next/server";
import http from "node:http";
import https from "node:https";

const DEFAULT_DAYS = 5;
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

function normalizeBaseUrl(value) {
  return String(value || "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/\/+$/, "");
}

function parsePositiveInt(value, fallback) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return fallback;
  return Math.floor(num);
}

function parseRequestBody(input = {}) {
  return {
    days: parsePositiveInt(input.days, DEFAULT_DAYS),
    page: parsePositiveInt(input.page, DEFAULT_PAGE),
    limit: Math.min(MAX_LIMIT, parsePositiveInt(input.limit, DEFAULT_LIMIT)),
  };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const body = parseRequestBody({
    days: searchParams.get("days"),
    page: searchParams.get("page"),
    limit: searchParams.get("limit"),
  });
  return fetchDeadlineJobs(body);
}

export async function POST(request) {
  const payload = await request.json().catch(() => ({}));
  return fetchDeadlineJobs(parseRequestBody(payload));
}

async function fetchDeadlineJobs(body) {
  const baseUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_BASE_URL);
  if (!baseUrl) {
    return NextResponse.json(
      { success: false, message: "NEXT_PUBLIC_BASE_URL is not configured" },
      { status: 500 },
    );
  }

  const upstreamUrl = `${baseUrl}/site/deadline-jobs`;

  try {
    const response = await sendGetWithBody(upstreamUrl, body);
    const payload = JSON.parse(response.bodyText || "null");
    if (!payload) {
      return NextResponse.json(
        { success: false, message: "Invalid response from upstream service" },
        { status: 502 },
      );
    }

    return NextResponse.json(payload, { status: response.statusCode });
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to connect to upstream service" },
      { status: 502 },
    );
  }
}

function sendGetWithBody(urlString, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlString);
    const isHttps = url.protocol === "https:";
    const client = isHttps ? https : http;
    const bodyText = JSON.stringify(body || {});

    const req = client.request(
      url,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(bodyText),
        },
      },
      (res) => {
        let raw = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          raw += chunk;
        });
        res.on("end", () => {
          resolve({
            statusCode: Number(res.statusCode || 500),
            bodyText: raw,
          });
        });
      },
    );

    req.on("error", reject);
    req.write(bodyText);
    req.end();
  });
}
