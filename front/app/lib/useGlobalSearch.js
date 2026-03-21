"use client";

import { useEffect, useState } from "react";
import { searchGlobalContent } from "./siteApi";

export const GLOBAL_SEARCH_MIN_LENGTH = 2;
export const GLOBAL_SEARCH_DEBOUNCE_MS = 400;

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function extractGlobalSearchResults(payload) {
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

export function useGlobalSearch({
  minLength = GLOBAL_SEARCH_MIN_LENGTH,
  debounceMs = GLOBAL_SEARCH_DEBOUNCE_MS,
  limit = 50,
} = {}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, debounceMs);

    return () => {
      clearTimeout(timer);
    };
  }, [debounceMs, searchQuery]);

  useEffect(() => {
    if (debouncedSearchQuery.length < minLength) {
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

        const payload = await searchGlobalContent({
          q: debouncedSearchQuery,
          limit,
          signal: controller.signal,
        });

        if (!active) {
          return;
        }

        setSearchResults(extractGlobalSearchResults(payload));
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
  }, [debouncedSearchQuery, limit, minLength]);

  const trimmedSearchQuery = searchQuery.trim();
  const isSearchPanelActive = trimmedSearchQuery.length >= minLength;
  const isDebouncingSearch =
    isSearchPanelActive && debouncedSearchQuery !== trimmedSearchQuery;

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    searchLoading,
    searchError,
    trimmedSearchQuery,
    isSearchPanelActive,
    isDebouncingSearch,
  };
}
