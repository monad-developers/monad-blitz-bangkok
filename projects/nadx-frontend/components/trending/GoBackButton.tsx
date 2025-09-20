"use client";

interface GoBackButtonProps {
  onClick?: () => void;
}

export default function GoBackButton({ onClick }: GoBackButtonProps) {
  return (
    <div className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <button
          className="flex items-center text-gray-600 hover:text-gray-900"
          onClick={onClick}
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Go back
        </button>
      </div>
    </div>
  );
}
