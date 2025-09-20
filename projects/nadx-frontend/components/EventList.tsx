'use client';

import { Button } from '@/components/ui/button';
import { PredictionCard } from './PredictionCard';
import { ENUM_TAG, getTagBySlug, TAG_LIST } from '@/data/configs';
import { IPolyEvent } from '@/types/poly.types';

interface RecentAppsProps {
  showViewAll?: boolean;
  maxItems?: number;
  eventsList: IPolyEvent[];
  tag: ENUM_TAG;
}

export const EventList = ({
  showViewAll = true,
  maxItems,
  eventsList,
  tag,
}: RecentAppsProps) => {
  const tagList = getTagBySlug(tag);

  const splicedEventsList = eventsList
    .filter((e) => {
      if (tag === ENUM_TAG.TRENDING || !tag) return true;
      return e.ourTagId.slug === tag;
    })
    .splice(0, maxItems || 3);

  return (
    <section className="space-y-6 mt-[24px]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{tagList.tile}</h2>
          <p className="text-sm text-gray-500">{tagList.description}</p>
        </div>

        {showViewAll && (
          <Button variant="ghost" className="rounded-2xl">
            View All
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 min-h-48 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3">
        {splicedEventsList.map((event) => (
          <PredictionCard key={event.id} event={event} />
        ))}
      </div>
    </section>
  );
};
