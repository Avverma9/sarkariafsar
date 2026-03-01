"use client";

import { useEffect, useState } from "react";
import Header from "./layout/Header";
import Footer from "./layout/Footer";
import Breadcrumbs from "./layout/Breadcrumbs";
import HeroSection from "./home/HeroSection";
import UpdatesSection from "./home/UpdatesSection";
import SchemesSection from "./home/SchemesSection";
import PlatformInfoSection from "./home/PlatformInfoSection";
import DetailsModal from "./home/DetailsModal";
import { statesList as fallbackStatesList, updatesData } from "./home/data";
import baseUrl from "../lib/baseUrl";
import {
  getAllGovSchemes,
  getGovSchemeByState,
  getGovSchemeStateNameOnly,
} from "../lib/govSchemesApi";

const MIN_SEARCH_LENGTH = 2;
const DEBOUNCE_MS = 400;

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function firstNonEmpty(values = []) {
  for (const value of values) {
    const text = String(value || "").trim();

    if (text) {
      return text;
    }
  }

  return "";
}

function normalizeStateName(value) {
  const state = String(value || "").trim();

  if (!state || state.toLowerCase() === "sabhi" || state.toLowerCase() === "all") {
    return "All India";
  }

  return state;
}

function uniqueStrings(values = []) {
  const seen = new Set();
  const result = [];

  values.forEach((value) => {
    const normalized = String(value || "").trim();
    const key = normalized.toLowerCase();

    if (!normalized || seen.has(key)) {
      return;
    }

    seen.add(key);
    result.push(normalized);
  });

  return result;
}

function getDefaultStates() {
  return uniqueStrings(["All India", ...asArray(fallbackStatesList).map(normalizeStateName)]);
}

function extractStateNames(payload) {
  const candidates = asArray(payload?.states).length
    ? payload.states
    : asArray(payload?.data).length
      ? payload.data
      : asArray(payload);

  const names = candidates
    .map((item) =>
      typeof item === "string"
        ? item
        : firstNonEmpty([item?.state, item?.stateName, item?.name, item?.title]),
    )
    .map(normalizeStateName)
    .filter((name) => name && name !== "All India");

  return uniqueStrings(names);
}

function toStringArray(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || "").trim())
      .filter(Boolean);
  }

  const text = String(value || "").trim();

  if (!text) {
    return [];
  }

  return text
    .split(/[,\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function toProcessSteps(value) {
  if (Array.isArray(value)) {
    return value
      .map((step) => String(step || "").trim())
      .filter(Boolean);
  }

  const text = String(value || "").trim();

  if (!text) {
    return [];
  }

  const lines = text
    .split(/\n+/)
    .map((line) => line.replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean);

  if (lines.length > 1) {
    return lines;
  }

  const numberedSplit = text
    .split(/\s+\d+\.\s+/)
    .map((line) => line.replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean);

  return numberedSplit.length > 0 ? numberedSplit : [text];
}

function getSchemeVisual(schemeType) {
  const normalized = String(schemeType || "").toLowerCase();

  if (
    normalized.includes("health") ||
    normalized.includes("medical") ||
    normalized.includes("water")
  ) {
    return { icon: "ShieldCheck", iconColor: "text-sky-500" };
  }

  if (normalized.includes("education") || normalized.includes("student")) {
    return { icon: "GraduationCap", iconColor: "text-indigo-500" };
  }

  if (
    normalized.includes("social") ||
    normalized.includes("women") ||
    normalized.includes("labour") ||
    normalized.includes("welfare")
  ) {
    return { icon: "Users", iconColor: "text-purple-500" };
  }

  if (
    normalized.includes("agriculture") ||
    normalized.includes("farmer") ||
    normalized.includes("animal")
  ) {
    return { icon: "HeartPulse", iconColor: "text-rose-500" };
  }

  return { icon: "Landmark", iconColor: "text-emerald-600" };
}

function extractSchemes(payload) {
  if (Array.isArray(payload?.schemes)) {
    return payload.schemes;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return asArray(payload);
}

function extractSearchResults(payload) {
  if (Array.isArray(payload?.results)) {
    return payload.results;
  }

  if (Array.isArray(payload?.data?.results)) {
    return payload.data.results;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return asArray(payload);
}

function normalizeScheme(scheme, index, selectedState) {
  const title = firstNonEmpty([
    scheme?.schemeTitle,
    scheme?.title,
    scheme?.schemeName,
    `Scheme ${index + 1}`,
  ]);
  const category = firstNonEmpty([
    scheme?.schemetype,
    scheme?.schemeType,
    scheme?.category,
    "Government Scheme",
  ]);
  const state = firstNonEmpty([
    normalizeStateName(scheme?.state),
    normalizeStateName(scheme?.stateName),
    normalizeStateName(selectedState),
    "All India",
  ]);
  const aboutScheme = firstNonEmpty([
    scheme?.aboutScheme,
    scheme?.description,
    scheme?.shortDesc,
    scheme?.benefits,
  ]);
  const shortDesc = aboutScheme.slice(0, 180);
  const process = toProcessSteps(scheme?.process);
  const documents = toStringArray(scheme?.requiredDocs || scheme?.documents);
  const visual = getSchemeVisual(category);

  return {
    id: scheme?.id || scheme?._id || `scheme-${index + 1}`,
    type: "scheme",
    title,
    category,
    state,
    shortDesc: shortDesc || "Yojana details available in official source.",
    benefits: aboutScheme || "Yojana details available in official source.",
    process:
      process.length > 0
        ? process
        : ["Official source par jakar scheme ki poori process check karein."],
    documents:
      documents.length > 0 ? documents : ["Aadhar Card", "Bank Account Details"],
    icon: visual.icon,
    iconColor: visual.iconColor,
    applyLink: firstNonEmpty([scheme?.applyLink, scheme?.officialLink]),
  };
}

export default function PortalApp() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [selectedState, setSelectedState] = useState("All India");
  const [selectedItem, setSelectedItem] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [statesList, setStatesList] = useState(() => getDefaultStates());
  const [statesLoading, setStatesLoading] = useState(false);
  const [schemesData, setSchemesData] = useState([]);
  const [schemesLoading, setSchemesLoading] = useState(true);
  const [hasLoadedSchemes, setHasLoadedSchemes] = useState(false);
  const [schemesError, setSchemesError] = useState("");

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [searchQuery]);

  useEffect(() => {
    if (debouncedSearchQuery.length < MIN_SEARCH_LENGTH) {
      setSearchResults([]);
      setSearchError("");
      setSearchLoading(false);
      return;
    }

    const controller = new AbortController();
    let active = true;

    async function runSearch() {
      try {
        if (active) {
          setSearchLoading(true);
          setSearchError("");
        }

        const response = await fetch(
          `${baseUrl}/find-by-title-job-and-scheme?keyword=${encodeURIComponent(
            debouncedSearchQuery,
          )}`,
          {
            method: "GET",
            cache: "no-store",
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error("Search failed");
        }

        const payload = await response.json();

        if (!active) {
          return;
        }

        setSearchResults(extractSearchResults(payload));
      } catch (error) {
        if (!active || error?.name === "AbortError") {
          return;
        }

        setSearchResults([]);
        setSearchError(error?.message || "Search failed");
      } finally {
        if (active) {
          setSearchLoading(false);
        }
      }
    }

    runSearch();

    return () => {
      active = false;
      controller.abort();
    };
  }, [debouncedSearchQuery]);

  useEffect(() => {
    let active = true;

    async function loadStateNames() {
      if (active) {
        setStatesLoading(true);
      }

      try {
        const payload = await getGovSchemeStateNameOnly();
        const apiStates = extractStateNames(payload);
        const resolvedStates = uniqueStrings(["All India", ...apiStates]);

        if (!active) {
          return;
        }

        setStatesList(resolvedStates.length > 0 ? resolvedStates : getDefaultStates());
        setSelectedState((current) =>
          resolvedStates.includes(current) ? current : "All India",
        );
      } catch {
        if (!active) {
          return;
        }

        const fallbackStates = getDefaultStates();
        setStatesList(fallbackStates);
        setSelectedState((current) =>
          fallbackStates.includes(current) ? current : "All India",
        );
      } finally {
        if (active) {
          setStatesLoading(false);
        }
      }
    }

    loadStateNames();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadSchemesByState() {
      setSchemesLoading(true);
      setSchemesError("");

      try {
        const payload =
          selectedState === "All India"
            ? await getAllGovSchemes()
            : await getGovSchemeByState(selectedState);
        const schemes = extractSchemes(payload).map((scheme, index) =>
          normalizeScheme(scheme, index, selectedState),
        );

        if (!active) {
          return;
        }

        setSchemesData(schemes);
      } catch (error) {
        if (!active) {
          return;
        }

        setSchemesData([]);
        setSchemesError(error?.message || "Schemes load nahi ho payi.");
      } finally {
        if (active) {
          setSchemesLoading(false);
          setHasLoadedSchemes(true);
        }
      }
    }

    loadSchemesByState();

    return () => {
      active = false;
    };
  }, [selectedState]);

  const trimmedSearchQuery = searchQuery.trim();
  const localFilteredSchemes = schemesData.slice(0, 6);
  const localFilteredUpdates = updatesData.filter((item) => {
    const matchesState = selectedState === "All India" || item.state === selectedState;
    return matchesState;
  });

  const isSearchPanelActive = trimmedSearchQuery.length >= MIN_SEARCH_LENGTH;
  const isDebouncingSearch = isSearchPanelActive && debouncedSearchQuery !== trimmedSearchQuery;
  const filteredSchemes = localFilteredSchemes;
  const filteredUpdates = localFilteredUpdates;

  return (
    <div className="selection:bg-indigo-500 selection:text-white flex min-h-screen flex-col bg-[#f8fafc] font-sans text-slate-800">
      <Header
        scrolled={scrolled}
        selectedState={selectedState}
        setSelectedState={setSelectedState}
        statesList={statesList}
        statesLoading={statesLoading}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      <HeroSection
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchResults={searchResults}
        showSearchResults={isSearchPanelActive}
        searchLoading={isSearchPanelActive && (searchLoading || isDebouncingSearch)}
        searchError={isSearchPanelActive ? searchError : ""}
      />

      <main className="relative z-30 mx-auto w-full max-w-[1500px] flex-grow px-4 pt-40 pb-20 sm:px-6 md:pt-36 lg:px-8">
        <Breadcrumbs className="mb-8" />
        <UpdatesSection filteredUpdates={filteredUpdates} onSelectItem={setSelectedItem} />

        <SchemesSection
          filteredSchemes={filteredSchemes}
          loading={schemesLoading}
          hasLoaded={hasLoadedSchemes}
          error={schemesError}
        />

        <PlatformInfoSection />
      </main>

      <Footer />

      <DetailsModal selectedItem={selectedItem} onClose={() => setSelectedItem(null)} />
    </div>
  );
}
