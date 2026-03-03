"use client";

/**
 * GizokBanner — Gizok (gizokraijaw.net) banner ad unit.
 *
 * The Gizok script appends itself to document.body, so each instance
 * runs inside an isolated iframe to allow multiple banners per page.
 *
 * Props:
 *  className  – extra Tailwind classes on the outer wrapper (optional)
 *  height     – iframe height in px (default 100)
 */

const GIZOK_ZONE = "10675651";
const GIZOK_SRC = "https://gizokraijaw.net/vignette.min.js";

const iframeDoc = `<!DOCTYPE html>
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

export default function GizokBanner({ className = "", height = 280 }) {
  return (
    <div
      className={`gizok-banner-wrapper w-full overflow-hidden text-center ${className}`.trim()}
      aria-label="Advertisement"
    >
      <iframe
        srcDoc={iframeDoc}
        title="Advertisement"
        scrolling="no"
        style={{ width: "100%", height, border: "none", background: "transparent" }}
        sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
      />
    </div>
  );
}
