"use client";

import React, { useState, useEffect } from "react";

interface CategoryTabsProps {
  onCategoryChange?: (category: string | null) => void;
}

export const CategoryTabs: React.FC<CategoryTabsProps> = ({ onCategoryChange }) => {
  const [activeCategory, setActiveCategory] = useState<string | null>("Trending");
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/polls/categories");
        const data = await response.json();

        if (data.success) {
          setCategories(data.categories);
        } else {
          console.error("Failed to fetch categories:", data.message);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleCategoryClick = (category: string | null) => {
    setActiveCategory(category);
    onCategoryChange?.(category);
  };

  // Default categories that always appear
  const defaultTabs = [
    {
      id: "trending",
      label: "Trending",
      value: "Trending",
      icon: (
        <svg height="20" width="20" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
          <title>arrow trend up</title>
          <g fill="currentColor">
            <path
              d="M1.75,12.25l3.646-3.646c.195-.195,.512-.195,.707,0l3.293,3.293c.195,.195,.512,.195,.707,0l6.146-6.146"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
            />
            <polyline
              fill="none"
              points="11.25 5.75 16.25 5.75 16.25 10.75"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
            />
          </g>
        </svg>
      ),
    },
    { id: "new", label: "New", value: "New" },
    { id: "k-series", label: "K-series", value: "K-series" },
    { id: "thai-drama", label: "Thai-drama", value: "Thai-drama" },
    { id: "netflix", label: "Netflix", value: "Netflix" },
    { id: "all", label: "All", value: null },
  ];

  const allTabs = [
    ...defaultTabs,
    ...categories.map(category => ({
      id: category.toLowerCase().replace(/\s+/g, '-'),
      label: category,
      value: category,
    }))
  ];

  if (isLoading) {
    return (
      <div className="w-full bg-background border-b">
        <div style={{ maxWidth: "1350px" }} className="w-full flex px-4 lg:px-6 mx-auto min-w-0">
          <div className="flex items-center h-12 gap-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-6 w-16 bg-base-300 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-background border-b">
      <div style={{ maxWidth: "1350px" }} className="w-full flex px-4 lg:px-6 mx-auto min-w-0 overflow-x-auto">
        <div className="relative">
          {/* Left gradient */}
          <div className="absolute left-0 top-0 bottom-0 w-8 md:w-16 bg-gradient-to-r from-background to-transparent z-[2] pointer-events-none transition-opacity duration-200 opacity-0" />

          {/* Scrollable tabs container */}
          <div className="flex overflow-x-auto snap-x scroll-px-3 snap-mandatory min-w-0 no-scrollbar h-12 pl-0 -ml-2 lg:-ml-2.5 items-center">

            {allTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleCategoryClick(tab.value)}
                className={`
                  inline-flex cursor-pointer z-[1] h-full items-center !transition-none justify-center
                  whitespace-nowrap rounded-md px-2.5 py-1 ring-offset-white transition-all
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                  disabled:pointer-events-none disabled:opacity-50 hover:text-text !text-sm gap-2
                  ${
                    activeCategory === tab.value
                      ? "font-semibold tracking-[-0.005em] text-text"
                      : "font-medium text-text-secondary hover:text-text"
                  }
                `}
              >
                {tab.icon && tab.icon}
                <p>{tab.label}</p>
              </button>
            ))}

            {/* Separator */}
            {categories.length > 0 && (
              <div className="h-5 w-px bg-border mx-3 hidden lg:block" />
            )}

            {/* More button */}
            <button
              className="hover:text-text my-auto hidden lg:flex transition gap-1.5 font-medium rounded-md text-sm text-text-secondary cursor-pointer py-1 px-3 h-10 items-center"
              aria-label="Open more navigation links"
            >
              More
              <svg height="12" width="12" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
                <g fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" stroke="currentColor">
                  <polyline points="1.75 4.25 6 8.5 10.25 4.25" />
                </g>
              </svg>
            </button>
          </div>

          {/* Right gradient */}
          <div className="absolute right-0 top-0 bottom-0 w-8 md:w-16 bg-gradient-to-l from-background to-transparent z-[2] pointer-events-none transition-opacity duration-200 opacity-0" />
        </div>
      </div>
    </div>
  );
};