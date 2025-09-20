"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PredictionOption } from "./types";

interface PredictionOptionsProps {
  predictionOptions: PredictionOption[];
  selectedOption: string;
  onOptionSelect: (optionId: string) => void;
}

export default function PredictionOptions({
  predictionOptions,
  selectedOption,
  onOptionSelect,
}: PredictionOptionsProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Choose your prediction
      </h3>
      <div className="space-y-3">
        {predictionOptions.map((option) => (
          <Card
            key={option.id}
            className={`p-4 cursor-pointer transition-colors ${
              selectedOption === option.id || option.selected
                ? "bg-purple-50 border-purple-200"
                : "hover:bg-gray-50"
            }`}
            onClick={() => onOptionSelect(option.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span className="font-medium">{option.range}</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600">
                  {option.volume} Vol. | {option.percentage}%
                </div>
                <div className="text-sm font-medium">{option.amount}</div>
                <div className="w-6 h-6 border-2 border-gray-300 rounded-full flex items-center justify-center">
                  {(selectedOption === option.id || option.selected) && (
                    <svg
                      className="w-4 h-4 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
                <Button
                  variant={
                    selectedOption === option.id || option.selected
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                >
                  {selectedOption === option.id || option.selected
                    ? "Selected"
                    : "Select"}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
