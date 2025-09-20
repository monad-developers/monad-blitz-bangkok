"use client";

import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

interface PredictionAmountProps {
  predictionAmount: string;
  setPredictionAmount: (amount: string) => void;
  selectedCurrency: string;
  setSelectedCurrency: (currency: string) => void;
}

export default function PredictionAmount({
  predictionAmount,
  setPredictionAmount,
  selectedCurrency,
  setSelectedCurrency,
}: PredictionAmountProps) {
  const formatNumber = (value: string) => {
    const num = parseFloat(value.replace(/,/g, ""));
    if (isNaN(num)) return value;
    return num.toLocaleString();
  };

  const handleAmountChange = (value: string) => {
    // Remove commas for processing
    const cleanValue = value.replace(/,/g, "");
    setPredictionAmount(cleanValue);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-medium text-gray-600">
        Enter your prediction amount
      </h3>

      {/* Amount Display */}
      <div className="space-y-4">
        <div className="text-5xl font-bold text-gray-900 tracking-tight">
          {formatNumber(predictionAmount)}
        </div>

        {/* Currency Selector */}
        <div className="flex items-center justify-end">
          <div className="relative">
            <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition-colors">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">$</span>
              </div>
              <span className="font-medium">USDC</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Percentage Buttons */}
        <div className="flex space-x-3">
          <Button
            variant="outline"
            className="border-gray-300 text-gray-600 hover:bg-gray-50 rounded-full px-6"
            onClick={() => handleAmountChange("20000")}
          >
            100%
          </Button>
          <Button
            variant="outline"
            className="border-gray-300 text-gray-600 hover:bg-gray-50 rounded-full px-6"
            onClick={() => handleAmountChange("20000")}
          >
            100%
          </Button>
        </div>
      </div>
    </div>
  );
}
