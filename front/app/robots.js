import { SITE_BASE_URL } from "./lib/site-config";

const siteUrl = SITE_BASE_URL.toString().replace(/\/$/, "");

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/search"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
