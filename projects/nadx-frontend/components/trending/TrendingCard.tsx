"use client";

import { CheckCircle, XCircle } from "lucide-react";
import Image from "next/image";

interface TrendingCardProps {
  id: string;
  profileImage: string;
  question: string;
  volume: string;
  prediction: string;
  percentage: string;
  isCorrect: boolean;
  className?: string;
}

export default function TrendingCard({
  id,
  profileImage,
  question,
  volume,
  prediction,
  percentage,
  isCorrect,
}: TrendingCardProps) {
  return (
    <div className="flex gap-3 items-center  text-gray-900 font-bold text-xl bg-[#F5F5F5] border border-[#6F61FF] rounded-full py-2 px-4 ${className} min-w-[520px] w-full">
      <Image
        src={profileImage}
        alt="profile"
        width={24}
        height={24}
        className="rounded-full"
      />
      <div className="font-semibold text-xs">{question}</div>
      <div className="text-xs font-normal">{volume}</div>
      <div className="border-l border-gray-300 h-4" />
      <div className="flex items-center gap-1">
        {isCorrect ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : (
          <XCircle className="h-4 w-4 text-red-500" />
        )}
        <div className="font-normal text-xs">{prediction}</div>
        <div className="font-normal text-xs">{percentage}</div>
      </div>
    </div>
  );
}
