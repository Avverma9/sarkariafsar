import { baseUrl } from "@/app/lib/baseUrl";
import { withApiJsonCache } from "@/app/lib/apiCache";

const DEFAULT_DAYS = 5;
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;
const CACHE_NAMESPACE = "deadline-jobs";
const CACHE_TTL_MS = 60 * 1000;

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
  const params = new URLSearchParams({
    days: String(body.days),
    page: String(body.page),
    limit: String(body.limit),
  });
  const upstreamUrl = `${baseUrl}/site/deadline-jobs?${params.toString()}`;

  return withApiJsonCache({
    namespace: CACHE_NAMESPACE,
    keyParts: body,
    ttlMs: CACHE_TTL_MS,
    loader: async () => {
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
          return {
            status: 502,
            cacheable: false,
            payload: {
              success: false,
              message: "Invalid response from upstream service",
            },
          };
        }

        return {
          status: response.status,
          payload,
        };
      } catch {
        return {
          status: 502,
          cacheable: false,
          payload: {
            success: false,
            message: "Failed to connect to upstream service",
          },
        };
      }
    },
  });
}
