"use client";

import { useState } from "react";
import Header from "./Header";
import Footer from "./Footer";
import Breadcrumbs from "./Breadcrumbs";
import { useGlobalSearch } from "../../lib/useGlobalSearch";

export default function PostPageShell({ children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    searchLoading,
    searchError,
    isSearchPanelActive,
    isDebouncingSearch,
  } = useGlobalSearch();

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <Header
        scrolled
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
