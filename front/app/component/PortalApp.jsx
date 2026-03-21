"use client";

import { useEffect, useState } from "react";
import Header from "./layout/Header";
import Footer from "./layout/Footer";
import Breadcrumbs from "./layout/Breadcrumbs";
import NativeBanner from "./ads/NativeBanner";
import HeroSection from "./home/HeroSection";
import UpdatesSection from "./home/UpdatesSection";
import ReminderSection from "./home/ReminderSection";
import SchemesSection from "./home/SchemesSection";
import PlatformInfoSection from "./home/PlatformInfoSection";
import DetailsModal from "./home/DetailsModal";
import { updatesData } from "./home/data";
import { getGovSchemesList } from "../lib/govSchemesApi";
import { assessSchemeContentQuality, createExcerpt } from "../lib/contentQuality";
import { useGlobalSearch } from "../lib/useGlobalSearch";

const HOME_SCHEMES_LIMIT = 6;
const DEFAULT_STATE = "All India";

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
  const process = toProcessSteps(scheme?.process);
  const documents = toStringArray(scheme?.requiredDocs || scheme?.documents);
  const visual = getSchemeVisual(category);
  const quality = assessSchemeContentQuality({
    title,
    category,
    state,
    about: aboutScheme,
    process,
    documents,
    applyLink: firstNonEmpty([scheme?.applyLink, scheme?.officialLink]),
    schemeStartDate: scheme?.schemeStartDate,
    schemeLastDate: scheme?.schemeLastDate,
  });

  return {
    id: scheme?.id || scheme?._id || `scheme-${index + 1}`,
    type: "scheme",
    title: quality.title || title,
    category,
    state,
    shortDesc: quality.summary || createExcerpt(aboutScheme, 180),
    benefits: quality.about,
    process: quality.process,
    documents: quality.documents,
    icon: visual.icon,
    iconColor: visual.iconColor,
    applyLink: firstNonEmpty([scheme?.applyLink, scheme?.officialLink]),
    indexable: quality.cardIndexable,
  };
}

export default function PortalApp({ initialData = {} }) {
  const {
    schemes: serverSchemes = [],
    sectionBlocks: serverSectionBlocks = [],
    jobsBySection: serverJobsBySection = {},
    reminderDays = 7,
    reminderJobs = [],
    reminderTotal = 0,
    reminderLoaded = false,
  } = initialData;

  const hasInitialSchemes = serverSchemes.length > 0;

  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    searchLoading,
    searchError,
    isSearchPanelActive,
    isDebouncingSearch,
  } = useGlobalSearch();
  const [selectedItem, setSelectedItem] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isHeroSearchVisible, setIsHeroSearchVisible] = useState(true);
  const [schemesData, setSchemesData] = useState(serverSchemes);
  const [schemesLoading, setSchemesLoading] = useState(!hasInitialSchemes);
  const [hasLoadedSchemes, setHasLoadedSchemes] = useState(hasInitialSchemes);
  const [schemesError, setSchemesError] = useState("");

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    if (hasInitialSchemes) {
      setSchemesData(serverSchemes);
      setSchemesLoading(false);
      setHasLoadedSchemes(true);
      setSchemesError("");
      return;
    }

    let active = true;

    async function loadSchemesByState() {
      setSchemesLoading(true);
      setSchemesError("");

      try {
        const payload = await getGovSchemesList({
          state: "",
          limit: HOME_SCHEMES_LIMIT,
        });
        const schemes = extractSchemes(payload).map((scheme, index) =>
          normalizeScheme(scheme, index, DEFAULT_STATE),
        ).filter((scheme) => scheme.indexable);

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
  }, [hasInitialSchemes, serverSchemes]);

  const localFilteredSchemes = schemesData.slice(0, HOME_SCHEMES_LIMIT);
  const filteredUpdates = updatesData;

  const filteredSchemes = localFilteredSchemes;

  return (
    <div className="selection:bg-indigo-500 selection:text-white flex min-h-screen flex-col bg-[#f8fafc] font-sans text-slate-800">
      <Header
        scrolled={scrolled}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        showSearch={!isHeroSearchVisible}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchResults={searchResults}
        searchLoading={isSearchPanelActive && (searchLoading || isDebouncingSearch)}
        searchError={isSearchPanelActive ? searchError : ""}
        showSearchResults={isSearchPanelActive}
      />

      <HeroSection
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchResults={searchResults}
        showSearchResults={isSearchPanelActive}
        searchLoading={isSearchPanelActive && (searchLoading || isDebouncingSearch)}
        searchError={isSearchPanelActive ? searchError : ""}
        onSearchVisibilityChange={setIsHeroSearchVisible}
      />

      <main className="relative z-30 mx-auto w-full max-w-[1500px] flex-grow px-4 pt-6 pb-20 sm:px-6 lg:px-8">
        <Breadcrumbs className="mb-8" />
        <NativeBanner className="mb-8" />
        <UpdatesSection
          filteredUpdates={filteredUpdates}
          onSelectItem={setSelectedItem}
          serverSectionBlocks={serverSectionBlocks}
          serverJobsBySection={serverJobsBySection}
        />

        <NativeBanner
          className="mt-10"
          frameClassName="h-[260px] sm:h-[300px] lg:h-[320px]"
        />
        <ReminderSection
          initialDays={reminderDays}
          initialJobs={reminderJobs}
          initialTotal={reminderTotal}
          initialLoaded={reminderLoaded}
        />

        <SchemesSection
          filteredSchemes={filteredSchemes}
          loading={schemesLoading}
          hasLoaded={hasLoadedSchemes}
          error={schemesError}
        />

        <NativeBanner className="my-8" />

        <PlatformInfoSection />

        <NativeBanner className="mt-8" />
      </main>

      <Footer />

      <DetailsModal selectedItem={selectedItem} onClose={() => setSelectedItem(null)} />
    </div>
  );
}
