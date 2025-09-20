import { useEffect, useState } from 'react';

export const useAppState = () => {
  const [progress, setProgress] = useState(0);
  const [notifications, setNotifications] = useState(5);
  const [activeTab, setActiveTab] = useState('trending');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
    {}
  );

  // Simulate progress loading
  useEffect(() => {
    const timer = setTimeout(() => setProgress(100), 1000);
    return () => clearTimeout(timer);
  }, []);

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  useEffect(() => {
    console.log('onchange', activeTab);
  }, [activeTab]);

  return {
    progress,
    notifications,
    activeTab,
    setActiveTab,
    sidebarOpen,
    setSidebarOpen,
    mobileMenuOpen,
    setMobileMenuOpen,
    expandedItems,
    toggleExpanded,
  };
};
