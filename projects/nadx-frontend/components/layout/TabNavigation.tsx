'use client';

import { Button } from '@/components/ui/button';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CHAIN_LIST, getTagBySlug } from '@/data/configs';
import { usePublicApi } from '@/hooks/useAPI';
import { IPolyTagResponseItem } from '@/types/poly.types';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Download, Flame, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface TabNavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const TabNavigation = ({
  activeTab,
  setActiveTab,
}: TabNavigationProps) => {
  const api = usePublicApi();
  const [tabs, setTabs] = useState<IPolyTagResponseItem[]>([]);

  useEffect(() => {
    fetchTabs();
  }, []);

  const fetchTabs = async () => {
    const response = await api.poly.getTags();
    if (response.isSuccess && response.data) {
      setTabs(response.data);
    }
  };

  const getCount = (slug: string) => {
    const tabFind = tabs.find(
      (tab) => tab.slug.toLowerCase() === slug.toLowerCase()
    );
    return tabFind ? tabFind.total : '0';
  };

  const tagsList = CHAIN_LIST.map((tag) => getTagBySlug(tag));

  return (
    <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <TabsList className="grid w-full max-w-[550px] grid-cols-5 gap-2 rounded-2xl p-1 bg-gray-100">
        {/* <TabsTrigger
          value="trending"
          className="rounded-xl data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:rounded-xl flex items-center gap-2"
          onClick={() => setActiveTab("trending")}
        >
          <Flame className="h-4 w-4" />
          Trending
        </TabsTrigger> */}
        {tagsList.map((tag) => (
          <TabsTrigger
            onClick={() => setActiveTab(tag.slug)}
            key={tag.slug}
            value={tag.slug}
            className="rounded-xl data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:rounded-xl flex items-center gap-2"
          >
            {tag.slug === 'trending' && <Flame className="h-4 w-4" />}
            {tag.label} {tag.slug !== 'trending' && `(${getCount(tag.slug)})`}
          </TabsTrigger>
        ))}
      </TabsList>

      <div className="hidden md:flex gap-2">
        {/* <Button variant="outline" className="rounded-2xl bg-transparent">
          <Download className="mr-2 h-4 w-4" />
          Install App
        </Button>
        <Button className="rounded-2xl">
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button> */}
        <ConnectButton chainStatus={'icon'} />
      </div>
    </div>
  );
};
