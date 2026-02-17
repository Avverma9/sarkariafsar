const DEFAULT_BASE_URL = "http://localhost:5000";

function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.API_BASE_URL ||
    DEFAULT_BASE_URL
  ).replace(/\/+$/, "");
}

async function parseJsonResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.message || `API request failed with status ${res.status}`;
    throw new Error(message);
  }
  return data;
}

export async function postListBySectionUrl({
  megaTitle,
  sectionUrl = "",
  page = 1,
  limit = 100,
} = {}) {
  if (!megaTitle || !String(megaTitle).trim()) {
    throw new Error("megaTitle is required");
  }

  const params = new URLSearchParams({
    megaTitle: String(megaTitle).trim(),
    page: String(page),
    limit: String(limit),
  });

  if (sectionUrl && String(sectionUrl).trim()) {
    params.set("sectionUrl", String(sectionUrl).trim());
  }

  const url = `${getBaseUrl()}/api/site/post-list-by-section-url?${params.toString()}`;
  const res = await fetch(url, { method: "GET" });
  return parseJsonResponse(res);
}

export async function findByTitle({
  title,
  megaSlug = "",
  sectionUrl = "",
  exact = false,
  page = 1,
  limit = 20,
} = {}) {
  if (!title || !String(title).trim()) {
    throw new Error("title is required");
  }

  const params = new URLSearchParams({
    title: String(title).trim(),
    page: String(page),
    limit: String(limit),
    exact: exact ? "true" : "false",
  });

  if (megaSlug && String(megaSlug).trim()) {
    params.set("megaSlug", String(megaSlug).trim());
  }
  if (sectionUrl && String(sectionUrl).trim()) {
    params.set("sectionUrl", String(sectionUrl).trim());
  }

  const url = `${getBaseUrl()}/api/site/find-by-title?${params.toString()}`;
  const res = await fetch(url, { method: "GET" });
  return parseJsonResponse(res);
}

export async function findByTitlePost({
  title,
  megaSlug = "",
  sectionUrl = "",
  exact = false,
  page = 1,
  limit = 20,
} = {}) {
  if (!title || !String(title).trim()) {
    throw new Error("title is required");
  }

  const url = `${getBaseUrl()}/api/site/find-by-title`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: String(title).trim(),
      megaSlug: String(megaSlug || "").trim(),
      sectionUrl: String(sectionUrl || "").trim(),
      exact: exact === true,
      page,
      limit,
    }),
  });

  return parseJsonResponse(res);
}

export default {
  postListBySectionUrl,
  findByTitle,
  findByTitlePost,
};
