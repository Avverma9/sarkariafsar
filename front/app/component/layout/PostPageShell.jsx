"use client";

import { useEffect, useState } from "react";
import Header from "./Header";
import Footer from "./Footer";
import Breadcrumbs from "./Breadcrumbs";
import { statesList as fallbackStatesList } from "../home/data";
import { getGovSchemeStateNameOnly } from "../../lib/govSchemesApi";
import baseUrl from "../../lib/baseUrl";
import { buildBrowserCachedFetchOptions } from "../../lib/fetchCache";

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

  if (!state || state.toLowerCase() === "sabhi") {
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

function asSearchResults(payload) {
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

export default function PostPageShell({ children }) {
  const [selectedState, setSelectedState] = useState("All India");
  const [statesList, setStatesList] = useState(() => getDefaultStates());
  const [statesLoading, setStatesLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

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
          buildBrowserCachedFetchOptions({}, { signal: controller.signal }),
        );

        if (!response.ok) {
          throw new Error("Search failed");
        }

        const payload = await response.json();

        if (!active) {
          return;
        }

        setSearchResults(asSearchResults(payload));
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

  const trimmedSearchQuery = searchQuery.trim();
  const isSearchPanelActive = trimmedSearchQuery.length >= MIN_SEARCH_LENGTH;
  const isDebouncingSearch = isSearchPanelActive && debouncedSearchQuery !== trimmedSearchQuery;

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

        const finalStates = resolvedStates.length > 0 ? resolvedStates : getDefaultStates();
        setStatesList(finalStates);
        setSelectedState((current) => (finalStates.includes(current) ? current : "All India"));
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

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <Header
        scrolled
        selectedState={selectedState}
        setSelectedState={setSelectedState}
        statesList={statesList}
        statesLoading={statesLoading}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        showSearch
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchResults={searchResults}
        searchLoading={isSearchPanelActive && (searchLoading || isDebouncingSearch)}
        searchError={isSearchPanelActive ? searchError : ""}
        showSearchResults={isSearchPanelActive}
      />

      <main className="flex-grow pt-24 sm:pt-28">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <Breadcrumbs className="mb-6 sm:mb-8" />
        </div>
        {children}
      </main>

      <Footer />
    </div>
  );
}
