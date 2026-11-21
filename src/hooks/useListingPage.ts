import { useCallback, useEffect, useState } from "react";

function useListingPage(basePath: string, reload: () => Promise<void>) {
  const listingPath = `${basePath}/listar`;
  const [isListing, setIsListing] = useState(
    () => window.location.pathname.replace(/\/+$/, "") === listingPath,
  );

  const navigateTo = useCallback((path: string) => {
    window.history.pushState({}, "", path);
    setIsListing(path === listingPath);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [listingPath]);

  useEffect(() => {
    function handlePopState() {
      setIsListing(window.location.pathname.replace(/\/+$/, "") === listingPath);
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [listingPath]);

  useEffect(() => {
    if (isListing) {
      void reload();
    }
  }, [isListing, reload]);

  return {
    isListing,
    showListing: () => navigateTo(listingPath),
    showForm: () => navigateTo(basePath),
  };
}

export default useListingPage;
