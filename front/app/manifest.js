import { BRAND_NAME, SITE_ICON_PATH } from "./lib/seo";

export default function manifest() {
  return {
    name: `${BRAND_NAME} - Jobs, Results, Schemes`,
    short_name: BRAND_NAME,
    description:
      "Sarkari jobs, results, admit cards aur government schemes ke latest updates.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#0f172a",
    icons: [
      {
        src: SITE_ICON_PATH,
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
