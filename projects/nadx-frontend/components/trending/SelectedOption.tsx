"use client";

export default function SelectedOption() {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Select</h3>
      <div className="bg-purple-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-purple-600 rounded-full flex items-center justify-center">
              <svg
                className="w-3 h-3 text-green-500"
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
            <span className="font-medium">$350-$360</span>
          </div>
          <div className="text-sm text-gray-600">$50,777.66 Vol. 66% $55</div>
        </div>
      </div>
    </div>
  );
}
