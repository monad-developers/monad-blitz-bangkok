"use client";

import { GridSkeleton } from "@/components/ui/skeleton";
import { lazy, Suspense } from "react";

// Lazy load tab components
const HomeTab = lazy(() =>
  import("@/components/tabs/HomeTab").then((module) => ({
    default: module.HomeTab,
  }))
);
const AppsTab = lazy(() =>
  import("@/components/tabs/AppsTab").then((module) => ({
    default: module.AppsTab,
  }))
);
const FilesTab = lazy(() =>
  import("@/components/tabs/FilesTab").then((module) => ({
    default: module.FilesTab,
  }))
);
const ProjectsTab = lazy(() =>
  import("@/components/tabs/ProjectsTab").then((module) => ({
    default: module.ProjectsTab,
  }))
);
const LearnTab = lazy(() =>
  import("@/components/tabs/LearnTab").then((module) => ({
    default: module.LearnTab,
  }))
);

interface LazyTabsProps {
  activeTab: string;
  apps: any[];
  recentFiles: any[];
  projects: any[];
  tutorials: any[];
  communityPosts: any[];
}

export const LazyTabs = ({
  activeTab,
  apps,
  recentFiles,
  projects,
  tutorials,
  communityPosts,
}: LazyTabsProps) => {
  const renderTabContent = () => {
    switch (activeTab) {
      case "home":
        return (
          <HomeTab
            apps={apps}
            recentFiles={recentFiles}
            projects={projects}
            communityPosts={communityPosts}
          />
        );
      case "apps":
        return <AppsTab apps={apps} />;
      case "files":
        return <FilesTab recentFiles={recentFiles} />;
      case "projects":
        return <ProjectsTab projects={projects} />;
      case "learn":
        return <LearnTab tutorials={tutorials} />;
      default:
        return (
          <HomeTab
            apps={apps}
            recentFiles={recentFiles}
            projects={projects}
            communityPosts={communityPosts}
          />
        );
    }
  };

  return (
    <Suspense fallback={<GridSkeleton count={8} />}>
      {renderTabContent()}
    </Suspense>
  );
};
