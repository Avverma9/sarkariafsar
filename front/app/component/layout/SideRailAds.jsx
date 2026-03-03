"use client";

import { useEffect, useState } from "react";
import { AD_SCRIPT_SRC, AD_CONTAINER_ID } from "./AdBanner";

const GIZOK_ZONE = "10675651";
const GIZOK_SRC = "https://gizokraijaw.net/vignette.min.js";

const effectiveIframeHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:100%;height:100%;background:transparent;display:flex;align-items:center;justify-content:center;overflow:hidden}
</style>
</head>
<body>
<div id="${AD_CONTAINER_ID}"></div>
<script async data-cfasync="false" src="${AD_SCRIPT_SRC}"><\/script>
</body>
</html>`;

const gizokIframeHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:100%;height:100%;background:transparent;display:flex;align-items:center;justify-content:center;overflow:hidden}
</style>
</head>
<body>
<script>(function(s){s.dataset.zone='${GIZOK_ZONE}',s.src='${GIZOK_SRC}'})([document.documentElement,document.body].filter(Boolean).pop().appendChild(document.createElement('script')))<\/script>
</body>
</html>`;

/**
 * SideRailAds — left/right gutter ad rails.
 *
 * Only rendered when the viewport is wide enough that true blank gutter
 * exists beside the max-w-7xl (1280px) content:
 *   min trigger: 1280 + 160 + 160 + 2×24px padding = ~1648px → we use 1700px.
 *
 * Rails have a solid background (matching the page bg) so they sit IN
 * the blank gutter space and never visually overlap page components.
 * z-index is intentionally low (z-10) — below headers, modals, etc.
 */
export default function SideRailAds() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const railClass =
    "fixed top-0 z-10 hidden h-full w-[160px] flex-col items-center justify-start gap-4 overflow-y-auto bg-slate-100 pt-24 pb-8 [@media(min-width:1700px)]:flex";

  return (
    <>
      {/* Left rail — Effective banner */}
      <div className={`left-0 ${railClass}`} aria-label="Advertisement">
        <iframe
          srcDoc={effectiveIframeHtml}
          title="Advertisement Left"
          scrolling="no"
          className="h-[600px] w-[160px] flex-shrink-0 border-0"
          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        />
      </div>

      {/* Right rail — Gizok banner */}
      <div className={`right-0 ${railClass}`} aria-label="Advertisement">
        <iframe
          srcDoc={gizokIframeHtml}
          title="Advertisement Right"
          scrolling="no"
          className="h-[600px] w-[160px] flex-shrink-0 border-0"
          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
        />
      </div>
    </>
  );
}

