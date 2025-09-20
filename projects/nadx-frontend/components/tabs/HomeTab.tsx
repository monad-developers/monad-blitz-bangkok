'use client';

import { EventList } from '@/components/EventList';
import { MarketAnalytics } from '@/components/MarketAnalytics';
import { ENUM_TAG } from '@/data/configs';
import { usePublicApi } from '@/hooks/useAPI';
import { useAppState } from '@/hooks/useAppState';
import { App, CommunityPost, Project, RecentFile } from '@/types';
import { IPolyEvent, IPolyTag } from '@/types/poly.types';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { memo, useEffect, useState } from 'react';

interface HomeTabProps {
  apps: App[];
  recentFiles: RecentFile[];
  projects: Project[];
  communityPosts: CommunityPost[];
}

export const HomeTab = memo(
  ({ apps, recentFiles, projects, communityPosts }: HomeTabProps) => {
    const api = usePublicApi();
    const [eventsList, setEventsList] = useState<IPolyEvent[]>([]);
    const [tagsList, setTagsList] = useState<IPolyTag[]>([]);
    const { activeTab } = useAppState();
    const [eventsListMap, setEventsListMap] = useState<
      Record<string, IPolyEvent[]>
    >({});

    useEffect(() => {
      fetchEvents();
    }, []);

    const fetchEvents = async () => {
      const response = await api.poly.getEvents({
        limit: 50,
        offset: 0,
      });
      if (response.isSuccess && response.data) {
        setEventsList(response.data.events);
      }
    };

    const getEventsFirstByTag = (tag: string) => {
      const result = eventsList.find((event) => {
        const check = event.ourTagId.slug === tag;
        return check;
      });
      return result;
    };

    console.log({ activeTabwww: activeTab });

    return (
      <div className="space-y-8">
        {/* Hero Section */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#8964F6] to-[#E1F0B7] p-8 text-white"
          >
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="space-y-4">
                <div className="text-4xl font-bold text-white">
                  New Weekly Prediction
                </div>
                <h2 className="text-4xl font-bold text-white">Challenge!</h2>
                <p>Join now to win up to 5,000 XP 💥</p>
              </div>
              <div className="absolute right-0 top-0">
                <Image
                  src="/image/nadx_banner.png"
                  alt="NADX Weekly Prediction Challenge"
                  className="h-[200px] w-full object-cover rounded-3xl"
                  width={614}
                  height={409}
                />
              </div>
            </div>
          </motion.div>
        </section>

        {activeTab === ENUM_TAG.TRENDING ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden"
          >
            <div>
              <MarketAnalytics eventsTop={eventsList[0]} />
              <EventList eventsList={eventsList} tag={ENUM_TAG.TRENDING} />
              <EventList eventsList={eventsList} tag={ENUM_TAG.POLITICS} />
              <EventList eventsList={eventsList} tag={ENUM_TAG.CRYPTO} />
              <EventList eventsList={eventsList} tag={ENUM_TAG.WORLD} />
              <EventList eventsList={eventsList} tag={ENUM_TAG.OTHER} />
            </div>
          </motion.div>
        ) : (
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="relative overflow-hidden"
            >
              <div>
                <MarketAnalytics eventsTop={getEventsFirstByTag(activeTab)} />
                <EventList
                  eventsList={eventsList}
                  tag={activeTab as ENUM_TAG}
                  maxItems={30}
                />
              </div>
            </motion.div>
          </div>
        )}

        {/* <RecentApps /> */}
        {/* <Politics /> */}
      </div>
    );
  }
);

HomeTab.displayName = 'HomeTab';
