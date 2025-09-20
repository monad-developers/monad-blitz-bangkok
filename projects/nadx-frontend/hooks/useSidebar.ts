"use client";

import { useCallback, useState } from "react";

export const useSidebar = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
    {}
  );

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen((prev) => !prev);
  }, []);

  const toggleExpanded = useCallback((title: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  }, []);

  return {
    sidebarOpen,
    mobileMenuOpen,
    expandedItems,
    toggleSidebar,
    toggleMobileMenu,
    toggleExpanded,
    setMobileMenuOpen,
  };
};
