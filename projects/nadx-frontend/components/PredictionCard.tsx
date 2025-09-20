"use client";

import { PredictionCardMarket } from "@/components/PredictionCardMarket";
import { Badge } from "@/components/ui/badge";
import { IPolyEvent } from "@/types/poly.types";
import { formatReadableNumber } from "@/utils/number.utils";
import { polyGetActiveMarket } from "@/utils/poly-utils";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

interface PredictionCardProps {
  event: IPolyEvent;
  className?: string;
}

export const PredictionCard = ({
  className = "",
  event,
}: PredictionCardProps) => {
  const marketSort = polyGetActiveMarket(event.markets).splice(0, 2);

  const tagsList = event.tags.map((tag) => tag.label).splice(0, 1);

  const mainTags = event.ourTagId;

  const onClick = () => {
    window.open(`https://polysign.io/market/${event.slug}`, "_blank");
  };
  console.log(event);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className={`relative bg-white rounded-2xl shadow-sm border border-gray-100 ${className}`}
    >
      {/* Top Bar with Rewards and Live Badge */}
      <Link href={`/event/${event.slug}`}>
        <div
          className={`flex items-center justify-between py-4 px-6 rounded-t-2xl ${
            event.ourTagId.label === "Sports"
              ? "bg-[#FDF7F5]"
              : event.ourTagId.label === "Politics"
              ? "bg-[#FBF1F8]"
              : event.ourTagId.label === "Tech"
              ? "bg-[#F5F3FD]"
              : "bg-[#F4FAF8]"
          } relative overflow-hidden`}
        >
          {event.ourTagId.label === "Sports" ? (
            <Image
              src="/svg/sport.svg"
              alt="coin slide"
              className="absolute -top-28 right-3"
              width={286}
              height={286}
            />
          ) : event.ourTagId.label === "Politics" ? (
            <Image
              src="/svg/politics.svg"
              alt="coin slide"
              className="absolute -top-8 right-5"
              width={160}
              height={232}
            />
          ) : event.ourTagId.label === "Tech" ? (
            <Image
              src="/svg/tech.svg"
              alt="crypto"
              className="absolute top-0 right-28"
              width={120}
              height={232}
            />
          ) : (
            <Image
              src="/svg/coin_slide.svg"
              alt="coin slide"
              className="absolute top-0 right-28"
              width={120}
              height={232}
            />
          )}
          <div className="flex items-center space-x-2 relative z-10">
            <Badge className="rounded-2xl bg-gray-50 text-gray-600 border-gray-200 flex items-center gap-1 text-xs">
              <div>+1.5</div>
              <Image
                src="/svg/token/monad.svg"
                alt="btc"
                width={24}
                height={24}
              />
            </Badge>
          </div>
          <Badge className="rounded-2xl border-pink-200 bg-pink-50 text-pink-700 text-sm relative z-10">
            <div className="h-2 w-2 rounded-full bg-pink-500 mr-2"></div>
            Live
          </Badge>
        </div>

        {/* Main Content Area */}
        <div className="space-y-4 px-6 py-8 z-10 bg-white relative -top-2 rounded-t-xl flex flex-col">
          <div className="flex items-center space-x-2">
            {/* Solana Logo */}
            <div className="w-[32px] h-[32px] overflow-cover rounded-64px] shrink-0">
              <Image
                className="object-cover w-full h-full rounded-full"
                src={event.icon}
                alt={event.ticker}
                width={32}
                height={32}
              />
            </div>
            <div>
              <h4 className="line-clamp-2 text-semibold text-gray-900 h-[48px]">
                {event.title}
              </h4>
            </div>
          </div>
          {/* Prediction Result */}
          <div className=" items-center h-[64px] gap-2">
            {marketSort.map((market) => (
              <PredictionCardMarket
                marketsList={marketSort}
                key={market.id}
                market={market}
              />
            ))}
          </div>
        </div>

        {/* Bottom Bar with Volume and Action Buttons */}
        <div className="px-6 pb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#4F45B5]">
              {formatReadableNumber(event.volume, 0)}$
            </span>
            <div className="flex items-center space-x-2">
              {tagsList.map((tag) => (
                <Badge
                  variant="outline"
                  className="rounded-2xl bg-gray-50 text-gray-700 border-gray-200"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};
