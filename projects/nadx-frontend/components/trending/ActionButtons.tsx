"use client";

import { Button } from "@/components/ui/button";

interface ActionButtonsProps {
  onSubmitPrediction?: () => void;
  onAddToPrelist?: () => void;
}

export default function ActionButtons({
  onSubmitPrediction,
  onAddToPrelist,
}: ActionButtonsProps) {
  return (
    <div className="space-y-3">
      <Button
        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
        onClick={onSubmitPrediction}
      >
        Submit Prediction
      </Button>
      <Button
        variant="outline"
        className="w-full border-purple-200 text-purple-600 hover:bg-purple-50"
        onClick={onAddToPrelist}
      >
        <svg
          className="w-4 h-4 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
          />
        </svg>
        Add to Prelist
      </Button>
    </div>
  );
}
