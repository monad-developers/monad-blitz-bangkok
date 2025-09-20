"use client";

import { getCryptoNames } from "@/lib/crypto-logos";
import { DynamicCryptoLogo } from "./DynamicBitcoinLogo";

export const CryptoLogoDemo = () => {
  return (
    <div className="p-8 bg-gray-50 rounded-2xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
        Available Cryptocurrency Logos
      </h2>

      <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-4">
        {getCryptoNames().map((logoName) => (
          <div key={logoName} className="flex flex-col items-center space-y-2">
            <DynamicCryptoLogo name={logoName} size={50} showPrice={false} />
            <span className="text-xs font-medium text-gray-700 capitalize">
              {logoName}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-white rounded-xl border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Usage Examples:
        </h3>
        <div className="space-y-3">
          <pre className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg overflow-x-auto">
            {`// Bitcoin logo
<DynamicCryptoLogo name="bitcoin" size={40} />

// Ethereum logo with price
<DynamicCryptoLogo 
  name="ethereum" 
  size={50} 
  showPrice={true}
  priceColor="text-blue-600"
/>

// Available logo names:
${getCryptoNames()
  .map((name) => `"${name}"`)
  .join(", ")}`}
          </pre>
        </div>
      </div>
    </div>
  );
};
