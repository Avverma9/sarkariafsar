"use client";

import { useEffect } from "react";

const BLOCKED_HOSTS = ["sarkariresult.com.cm", "sarkariexam.com", "rojgarresult.com"];
const ALLOWED_FILE_EXTENSIONS = [".pdf", ".png", ".jpg", ".jpeg", ".webp"];

function resolveUrl(href) {
  if (!href) return null;
  try {
    return new URL(String(href), window.location.href);
  } catch {
    return null;
  }
}

function isBlockedHost(hostname) {
  const host = String(hostname || "").toLowerCase();
  return BLOCKED_HOSTS.some(
    (blocked) => host === blocked || host === `www.${blocked}` || host.endsWith(`.${blocked}`),
  );
}

function isBlockedUrl(href) {
  const url = resolveUrl(href);
  if (!url) return false;
  return isBlockedHost(url.hostname);
}

function isAllowedFileUrl(href) {
  const url = resolveUrl(href);
  if (!url) return false;
  const pathname = String(url.pathname || "").toLowerCase();
  return ALLOWED_FILE_EXTENSIONS.some((ext) => pathname.endsWith(ext));
}

function shouldBlockUrl(href) {
  return isBlockedUrl(href) && !isAllowedFileUrl(href);
}

export default function ExternalLinkGuard() {
  useEffect(() => {
    const originalOpen = window.open;

    const blockAnchorNavigation = (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a[href]");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!shouldBlockUrl(href)) return;

      event.preventDefault();
      event.stopPropagation();
    };

    window.open = function patchedOpen(url, ...args) {
      if (typeof url === "string" || url instanceof URL) {
        const rawUrl = String(url);
        if (shouldBlockUrl(rawUrl)) {
          return null;
        }
      }
      return originalOpen.call(window, url, ...args);
    };

    document.addEventListener("click", blockAnchorNavigation, true);
    document.addEventListener("auxclick", blockAnchorNavigation, true);

    return () => {
      window.open = originalOpen;
      document.removeEventListener("click", blockAnchorNavigation, true);
      document.removeEventListener("auxclick", blockAnchorNavigation, true);
    };
  }, []);

  return null;
}
