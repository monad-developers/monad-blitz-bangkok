'use client';

import { ArrowLeftCircle } from 'lucide-react';
import { Button } from '../ui/button';
import TrendingCard from './TrendingCard';
import { ConnectButton } from '@rainbow-me/rainbowkit';

interface TrendingCard {
  id: string;
  profileImage: string;
  question: string;
  volume: string;
  prediction: string;
  percentage: string;
  isCorrect: boolean;
}

const trendingData: TrendingCard[] = [
  {
    id: '1',
    profileImage: '/placeholder-user.jpg',
    question: 'Fed decision in September?',
    volume: '$50,777.66 Vol.',
    prediction: '50+ bps decrease',
    percentage: '66%',
    isCorrect: true,
  },
  {
    id: '2',
    profileImage: '/placeholder-user.jpg',
    question: 'Bitcoin price by year end?',
    volume: '$75,234.12 Vol.',
    prediction: 'Above $100k',
    percentage: '78%',
    isCorrect: true,
  },
  {
    id: '3',
    profileImage: '/placeholder-user.jpg',
    question: 'Election outcome 2024?',
    volume: '$125,456.78 Vol.',
    prediction: 'Democratic win',
    percentage: '45%',
    isCorrect: false,
  },
  {
    id: '4',
    profileImage: '/placeholder-user.jpg',
    question: 'Tesla stock performance?',
    volume: '$89,123.45 Vol.',
    prediction: '20% increase',
    percentage: '72%',
    isCorrect: true,
  },
];

export default function TrendingHeader() {
  return (
    <div className="bg-white">
      <div className="py-6">
        <div className="space-y-6">
          <div className="flex items-center space-x-2 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <span className="text-2xl">🔥</span>
            <h2 className="font-semibold text-gray-900">Trending</h2>
          </div>

          <div className="relative overflow-hidden">
            <div className="flex gap-4 animate-marquee hover:pause-marquee whitespace-nowrap">
              {/* First set of cards */}
              {trendingData.map((card, index) => (
                <div key={`first-${card.id}`} className="flex-shrink-0">
                  <TrendingCard
                    id={card.id}
                    profileImage={card.profileImage}
                    question={card.question}
                    volume={card.volume}
                    prediction={card.prediction}
                    percentage={card.percentage}
                    isCorrect={card.isCorrect}
                  />
                </div>
              ))}
              {/* Duplicate set for seamless loop */}
              {trendingData.map((card, index) => (
                <div key={`second-${card.id}`} className="flex-shrink-0">
                  <TrendingCard
                    id={card.id}
                    profileImage={card.profileImage}
                    question={card.question}
                    volume={card.volume}
                    prediction={card.prediction}
                    percentage={card.percentage}
                    isCorrect={card.isCorrect}
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="w-full flex justify-between mx-auto px-4 sm:px-6 lg:px-8">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 text-[#4F45B5] text-base"
            >
              <ArrowLeftCircle className="h-5 w-5" />
              <div>Go back</div>
            </Button>
            <ConnectButton chainStatus={'icon'} />
          </div>
        </div>
      </div>
    </div>
  );
}
