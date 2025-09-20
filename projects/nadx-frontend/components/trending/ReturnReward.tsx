"use client";

interface ReturnRewardProps {
  estimatedReturn: string;
}

export default function ReturnReward({ estimatedReturn }: ReturnRewardProps) {
  return (
    <div className="space-y-6">
      {/* Estimated Return */}
      <div className="space-y-2">
        <div className="text-lg font-medium text-gray-600">
          Estimated Return:
        </div>
        <div className="text-2xl font-bold text-green-600">
          {estimatedReturn}
        </div>
      </div>

      {/* Reward */}
      <div className="space-y-2">
        <div className="text-lg font-medium text-gray-600">Reward:</div>
        <div className="flex items-center space-x-4">
          <div className="bg-gray-100 text-gray-700 px-3 py-1 rounded-md text-sm font-medium">
            +10 XP
          </div>
          <div className="flex items-center bg-purple-100 text-purple-700 px-3 py-1 rounded-md">
            <span className="text-sm font-medium mr-2">+50</span>
            <div className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
