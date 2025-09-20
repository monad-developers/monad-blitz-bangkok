"use client";

import { Button } from "@/components/ui/button";
import { sidebarItems } from "@/data/sidebar-config";
import { useSidebar } from "@/hooks/useSidebar";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import { Sidebar } from "./Sidebar";

interface LayoutProviderProps {
  children: React.ReactNode;
}

export const LayoutProvider = ({ children }: LayoutProviderProps) => {
  const {
    sidebarOpen,
    mobileMenuOpen,
    expandedItems,
    toggleSidebar,
    toggleMobileMenu,
    toggleExpanded,
    setMobileMenuOpen,
  } = useSidebar();

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={toggleMobileMenu}
        aria-label="Toggle mobile menu"
      >
        {mobileMenuOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Menu className="h-6 w-6" />
        )}
      </Button>

      {/* Desktop sidebar toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-40 hidden md:flex"
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
      >
        <Menu className="h-6 w-6" />
      </Button>

      {/* Sidebar */}
      <Sidebar
        sidebarItems={sidebarItems}
        expandedItems={expandedItems}
        toggleExpanded={toggleExpanded}
        sidebarOpen={sidebarOpen}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* Main content */}
      <main
        className={cn(
          "transition-all duration-300 ease-in-out",
          sidebarOpen ? "md:ml-64" : "md:ml-0"
        )}
      >
        {children}
      </main>
    </div>
  );
};
