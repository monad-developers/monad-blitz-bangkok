"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingPrediction } from "./types";

interface PredictionHeaderProps {
  predictionData: TrendingPrediction;
}

export default function PredictionHeader({
  predictionData,
}: PredictionHeaderProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
            {predictionData.logo}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {predictionData.title}
            </h1>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
            Live
          </span>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">
            {predictionData.percentage}%
          </span>
          <span className="text-sm text-gray-600">$350-$360</span>
          <span className="text-sm text-gray-600">
            {predictionData.volume} Vol.
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {predictionData.tags.map((tag, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          <Button variant="outline" size="sm">
            +
          </Button>
        </div>
      </div>
    </div>
  );
}
