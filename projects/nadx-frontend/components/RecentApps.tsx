"use client";

import { Button } from "@/components/ui/button";
import { PredictionCard } from "./PredictionCard";

interface RecentAppsProps {
  showViewAll?: boolean;
  maxItems?: number;
}

export const RecentApps = ({
  showViewAll = true,
  maxItems,
}: RecentAppsProps) => {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Crypto Markets 🔮</h2>
          <p className="text-sm text-gray-500">
            Top predicted markets this month by volume
          </p>
        </div>

        {showViewAll && (
          <Button variant="ghost" className="rounded-2xl">
            View All
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3">
        <PredictionCard
          question="What price will Bitcoin hit in September?"
          prediction="$350-$360"
          confidence="40%"
          volume="$128,756,009 Vol."
          xpReward="+10 XP"
        />
        <PredictionCard
          question="What price will Bitcoin hit in September?"
          prediction="$350-$360"
          confidence="40%"
          volume="$128,756,009 Vol."
          xpReward="+10 XP"
        />
        <PredictionCard
          question="What price will Bitcoin hit in September?"
          prediction="$350-$360"
          confidence="40%"
          volume="$128,756,009 Vol."
          xpReward="+10 XP"
        />
      </div>
    </section>
  );
};
