'use client';

import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { PredictionCard } from './PredictionCard';
import { IPolyEvent } from '@/types/poly.types';
import { getBarChartData } from '@/utils/poly-utils';

interface BarData {
  month: string;
  blue: number;
  lightblue: number;
  light: number;
}

interface MarketAnalyticsProps {
  className?: string;
  eventsTop?: IPolyEvent;
}

export const MarketAnalytics = ({
  className = '',
  eventsTop,
}: MarketAnalyticsProps) => {
  return (
    <div className="rounded-2xl bg-[#FAFAFA] ">
      <div className="flex items-center justify-between p-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">
            Most Popular Markets
          </h3>
          <p className="text-sm text-gray-500">
            Top predicted markets this month by volume
          </p>
        </div>
        <Button
          variant="outline"
          className="rounded-2xl bg-gray-50 text-gray-600 hover:bg-gray-100"
        >
          7 Days
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </div>
      <section className={`grid grid-cols-1 gap-8 lg:grid-cols-2 ${className}`}>
        {/* Most Popular Markets Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className=" p-6"
        >
          {/* Bar Chart */}
          <div className="space-y-4">
            <div className="flex items-end justify-between h-56">
              {getBarChartData(eventsTop?.markets).map((bar) => (
                <div
                  key={bar.name}
                  className="flex flex-col items-center space-y-2"
                >
                  <div className="flex flex-col justify-end h-56 w-8">
                    <div
                      className="w-full rounded-t-md -mb-1.5"
                      style={{
                        height: `${bar.c}%`,
                        backgroundColor: '#E1E5E9',
                      }}
                    />
                    <div
                      className="w-full rounded-t-md -mb-1.5"
                      style={{
                        height: `${bar.b}%`,
                        backgroundColor: '#6F61FF',
                      }}
                    />
                    <div
                      className="w-full rounded-t-md"
                      style={{
                        height: `${bar.a}%`,
                        backgroundColor: '#4F45B5',
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-600">{bar.name}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Bitcoin Prediction Card */}
        {eventsTop && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className=" p-6"
          >
            <PredictionCard event={eventsTop} />
          </motion.div>
        )}
      </section>
    </div>
  );
};
