"use client";

import { GridSkeleton, ListSkeleton } from "@/components/ui/skeleton";
import { ReactNode } from "react";

interface LoadingWrapperProps {
  children: ReactNode;
  isLoading: boolean;
  type?: "grid" | "list" | "custom";
  count?: number;
  fallback?: ReactNode;
}

export const LoadingWrapper = ({
  children,
  isLoading,
  type = "grid",
  count = 8,
  fallback,
}: LoadingWrapperProps) => {
  if (isLoading) {
    if (fallback) {
      return <>{fallback}</>;
    }

    switch (type) {
      case "list":
        return <ListSkeleton count={count} />;
      case "grid":
      default:
        return <GridSkeleton count={count} />;
    }
  }

  return <>{children}</>;
};
