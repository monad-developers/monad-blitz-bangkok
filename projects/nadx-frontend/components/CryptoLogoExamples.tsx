"use client";

import { getCryptoInfo, getCryptoNames } from "@/lib/crypto-logos";
import { DynamicCryptoLogo } from "./DynamicBitcoinLogo";

export const CryptoLogoExamples = () => {
  const examples = [
    { name: "bitcoin" as const, size: 60, showPrice: true },
    { name: "ethereum" as const, size: 50, showPrice: true },
    { name: "solana" as const, size: 40, showPrice: false },
    { name: "cardano" as const, size: 45, showPrice: true },
  ];

  return (
    <div className="p-6 bg-white rounded-xl border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Dynamic Crypto Logo Examples
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {examples.map(({ name, size, showPrice }) => {
          const cryptoInfo = getCryptoInfo(name);
          return (
            <div key={name} className="flex flex-col items-center space-y-2">
              <DynamicCryptoLogo
                name={name}
                size={size}
                showPrice={showPrice}
                priceColor={cryptoInfo.color}
              />
              <div className="text-center">
                <div className="text-sm font-medium text-gray-900">
                  {cryptoInfo.name}
                </div>
                <div className="text-xs text-gray-500">{cryptoInfo.symbol}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">
            Available Cryptocurrencies:
          </h4>
          <div className="flex flex-wrap gap-2">
            {getCryptoNames().map((name) => (
              <span
                key={name}
                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
              >
                {name}
              </span>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Usage:</h4>
          <pre className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg overflow-x-auto">
            {`import { DynamicCryptoLogo } from "./DynamicBitcoinLogo";

// Basic usage
<DynamicCryptoLogo name="bitcoin" size={40} />

// With price display
<DynamicCryptoLogo 
  name="ethereum" 
  size={50} 
  showPrice={true}
  priceColor="text-blue-600"
/>

// All available names:
${getCryptoNames()
  .map((name) => `"${name}"`)
  .join(", ")}`}
          </pre>
        </div>
      </div>
    </div>
  );
};
