"use client";

export const AD_SCRIPT_SRC =
  "https://pl28832427.effectivegatecpm.com/3b266d8e0348710770426d19055c06d6/invoke.js";
export const AD_CONTAINER_ID = "container-3b266d8e0348710770426d19055c06d6";

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
<div id="${AD_CONTAINER_ID}"></div>
<script async data-cfasync="false" src="${AD_SCRIPT_SRC}"><\/script>
</body>
</html>`;

/**
 * AdBanner — Effectivegatecpm banner ad.
 * Uses an iframe so multiple instances on the same page each work
 * independently (each iframe has its own document + container ID).
 *
 * Props:
 *  className – extra Tailwind classes on the wrapper (optional)
 *  height    – iframe height in px (default 100)
 */
export default function AdBanner({ className = "", height = 280 }) {
  return (
    <div
      className={`ad-banner-wrapper w-full overflow-hidden text-center ${className}`.trim()}
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


