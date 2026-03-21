"use client";

import React from "react";

const SCRIPT_SRC = "https://pl28832427.profitableratecpm.com/3b266d8e0348710770426d19055c06d6/invoke.js";
const CONTAINER_ID = "container-3b266d8e0348710770426d19055c06d6";

// 1. Iframe ke andar ka HTML (With strict responsive CSS)
const FRAME_HTML = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
    <style>
      html, body {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        background: transparent;
        display: flex;
        justify-content: center;
        align-items: center;
        overflow: hidden;
      }

      #${CONTAINER_ID} {
        width: 100%;
        max-width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
      }

      /* CRITICAL: Force all injected ad elements (iframe, div, ins, img) to scale down on mobile */
      #${CONTAINER_ID} * {
        max-width: 100% !important;
        height: auto !important;
        object-fit: contain;
      }
    </style>
  </head>
  <body>
    <div id="${CONTAINER_ID}"></div>
    <script async="async" data-cfasync="false" src="${SCRIPT_SRC}"></script>
  </body>
</html>`;

export default function NativeBanner({
  className = "",
  label = "Sponsored",
}) {
  return (
    <section 
      aria-label={label} 
      className={`w-full max-w-full overflow-hidden my-6 ${className}`.trim()}
    >
      <div className="flex items-center justify-start mb-2 px-1">
        <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase bg-slate-50 px-2 py-1 rounded">
          {label}
        </span>
      </div>
      
      {/* 2. Responsive Wrapper for the Iframe */}
      <div className="relative w-full flex items-center justify-center bg-transparent rounded-lg overflow-hidden min-h-[250px] sm:min-h-[280px] md:min-h-[320px] lg:min-h-[360px]">
        <iframe
          title={label}
          loading="lazy"
          scrolling="no"
          srcDoc={FRAME_HTML}
          className="absolute inset-0 w-full h-full border-0 bg-transparent"
          style={{ width: "100%", height: "100%" }}
        />
      </div>
    </section>
  );
}