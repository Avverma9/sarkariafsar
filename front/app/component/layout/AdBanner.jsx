"use client";

import { useEffect, useMemo, useRef } from "react";

const ADSENSE_PUBLISHER_ID = "ca-pub-5390089359360512";
const DEFAULT_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT || "";

/**
 * AdBanner — AdSense-ready ad unit.
 *
 * Note:
 * - Requires `NEXT_PUBLIC_ADSENSE_SLOT` for live ad serving.
 * - Publisher script is loaded globally in app/layout.js.
 */
export default function AdBanner({ className = "", height = 280, slot = DEFAULT_SLOT }) {
  const adRef = useRef(null);
  const resolvedSlot = useMemo(() => String(slot || "").trim(), [slot]);

  useEffect(() => {
    if (!resolvedSlot || !adRef.current) {
      return;
    }

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // Ignore duplicate push/runtime errors in strict mode.
    }
  }, [resolvedSlot]);

  if (!resolvedSlot) {
    return null;
  }

  return (
    <div
      className={`ad-banner-wrapper w-full overflow-hidden text-center ${className}`.trim()}
      aria-label="Advertisement"
      style={{ minHeight: height }}
    >
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block", minHeight: height }}
        data-ad-client={ADSENSE_PUBLISHER_ID}
        data-ad-slot={resolvedSlot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}

