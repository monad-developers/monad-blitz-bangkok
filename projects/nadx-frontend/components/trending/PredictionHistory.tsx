"use client";

export default function PredictionHistory() {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Your Prediction History
      </h3>
      <div className="space-y-3">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">$350-$360 66%</span>
            </div>
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
          </div>
        ))}
      </div>
    </div>
  );
}
