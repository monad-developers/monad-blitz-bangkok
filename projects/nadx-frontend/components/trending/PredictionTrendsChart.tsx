"use client";

export default function PredictionTrendsChart() {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Prediction Trends
      </h3>
      <div className="flex items-end space-x-2 h-32">
        {[1, 2, 3, 4, 5, 6].map((bar, index) => (
          <div key={index} className="flex-1 flex flex-col items-center">
            <div
              className="w-full bg-purple-200 rounded-t"
              style={{ height: `${Math.random() * 80 + 20}px` }}
            >
              <div
                className="w-full bg-purple-600 rounded-t"
                style={{ height: `${Math.random() * 60 + 10}px` }}
              ></div>
            </div>
            <span className="text-xs text-gray-600 mt-2">Dec 31</span>
          </div>
        ))}
      </div>
    </div>
  );
}
