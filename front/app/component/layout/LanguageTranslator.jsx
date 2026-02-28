"use client";

import { Languages } from "lucide-react";
import { useEffect, useState } from "react";

const GOOGLE_SCRIPT_ID = "google-translate-script";
const GOOGLE_CONTAINER_ID = "google_translate_element";
const GOOGLE_COOKIE_KEY = "googtrans";
const LANGUAGE_OPTIONS = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
];

function readCookie(name) {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : "";
}

function readSelectedLanguage() {
  const cookieValue = readCookie(GOOGLE_COOKIE_KEY);
  return cookieValue.endsWith("/hi") ? "hi" : "en";
}

function writeLanguageCookie(languageCode) {
  const cookieValue = `/en/${languageCode}`;
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${GOOGLE_COOKIE_KEY}=${cookieValue};path=/;max-age=${maxAge}`;
}

function ensureTranslateContainer() {
  if (document.getElementById(GOOGLE_CONTAINER_ID)) {
    return;
  }

  const container = document.createElement("div");
  container.id = GOOGLE_CONTAINER_ID;
  container.setAttribute("aria-hidden", "true");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "-9999px";
  document.body.appendChild(container);
}

function applyLanguage(languageCode) {
  const combo = document.querySelector(".goog-te-combo");

  if (!combo) {
    return false;
  }

  combo.value = languageCode;
  combo.dispatchEvent(new Event("change"));
  return true;
}

function initGoogleTranslateElement() {
  if (!window.google?.translate?.TranslateElement) {
    return;
  }

  if (window.__googleTranslateInitialized) {
    return;
  }

  window.__googleTranslateInitialized = true;
  new window.google.translate.TranslateElement(
    {
      pageLanguage: "en",
      includedLanguages: "en,hi",
      autoDisplay: false,
    },
    GOOGLE_CONTAINER_ID,
  );
}

function ensureGoogleTranslateScript() {
  if (window.google?.translate?.TranslateElement) {
    initGoogleTranslateElement();
    return;
  }

  if (!document.getElementById(GOOGLE_SCRIPT_ID)) {
    const script = document.createElement("script");
    script.id = GOOGLE_SCRIPT_ID;
    script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.body.appendChild(script);
  }
}

export default function LanguageTranslator({ scrolled = false, mobile = false }) {
  const [activeLanguage, setActiveLanguage] = useState("en");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    ensureTranslateContainer();
    window.googleTranslateElementInit = initGoogleTranslateElement;
    ensureGoogleTranslateScript();

    const selectedLanguage = readSelectedLanguage();
    setActiveLanguage(selectedLanguage);

    let attempts = 0;
    const maxAttempts = 25;
    const timer = window.setInterval(() => {
      const isApplied = applyLanguage(selectedLanguage);
      attempts += 1;

      if (isApplied || attempts >= maxAttempts) {
        window.clearInterval(timer);
      }
    }, 160);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  function switchLanguage(languageCode) {
    setActiveLanguage(languageCode);
    writeLanguageCookie(languageCode);

    let attempts = 0;
    const maxAttempts = 25;
    const timer = window.setInterval(() => {
      const isApplied = applyLanguage(languageCode);
      attempts += 1;

      if (isApplied || attempts >= maxAttempts) {
        window.clearInterval(timer);
      }
    }, 140);
  }

  return (
    <div
      className={
        mobile
          ? "rounded-xl border border-slate-200 bg-slate-50 p-3"
          : `flex items-center gap-2 rounded-full border px-3 py-2 backdrop-blur-md ${
              scrolled
                ? "border-slate-200 bg-white text-slate-700"
                : "border-white/20 bg-white/20 text-white"
            }`
      }
    >
      <div
        className={`inline-flex items-center gap-1 ${
          mobile ? "mb-2 text-xs font-black tracking-wide text-slate-500 uppercase" : "sr-only"
        }`}
      >
        <Languages className="h-3.5 w-3.5" />
        Language
      </div>

      <div className="flex items-center gap-2">
        {LANGUAGE_OPTIONS.map((language) => {
          const isActive = activeLanguage === language.code;

          return (
            <button
              key={language.code}
              type="button"
              onClick={() => switchLanguage(language.code)}
              className={`rounded-full border px-3 py-1 text-xs font-black tracking-wide transition-colors ${
                isActive
                  ? "border-indigo-500 bg-indigo-600 text-white"
                  : mobile
                    ? "border-slate-300 bg-white text-slate-700 hover:border-indigo-300 hover:text-indigo-700"
                    : scrolled
                      ? "border-slate-300 bg-white text-slate-700 hover:border-indigo-300 hover:text-indigo-700"
                      : "border-white/35 bg-white/10 text-white hover:border-white/60 hover:bg-white/20"
              }`}
            >
              {language.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
