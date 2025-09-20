import { IPolyMarket } from '@/types/poly.types';
import { formatReadableNumber } from '@/utils/number.utils';
import { polyGetPrice } from '@/utils/poly-utils';
import { CheckCircle } from 'lucide-react';
import Image from 'next/image';

interface EventMarketItemProp {
  market: IPolyMarket;
  className?: string;
  selectedMarket?: IPolyMarket;
  handleSelect: (m: IPolyMarket) => void;
}

export const EventMarketItem = ({
  className = '',
  market,
  selectedMarket,
  handleSelect,
}: EventMarketItemProp) => {
  const isSelect = market.id === selectedMarket?.id;
  const price = polyGetPrice(market).toFixed(2);
  const priceNo = (100 - polyGetPrice(market)).toFixed(2);

  return (
    <div
      key={market.id}
      className={`flex items-center justify-between p-4 rounded-lg border ${
        isSelect
          ? 'bg-purple-50 border-2 border-dashed border-purple-300'
          : 'bg-white border border-gray-200 hover:bg-gray-50'
      }`}
    >
      {/* Left side - Icon and info */}
      <div className="flex items-center space-x-3">
        <Image src="/svg/document.svg" alt="document" width={40} height={40} />
        <div>
          <div className="text-gray-900">{market.groupItemTitle}</div>
          <div className="text-sm text-gray-600 flex items-center gap-1">
            <span>{formatReadableNumber(+market.volume)} Vol.</span>
            <div className="border-l border-gray-300 h-4" />
            <CheckCircle className="h-5 w-5 text-green-600 ml-1" />
            <span className="text-green-600 ml-1">{price}%</span>
          </div>
        </div>
      </div>

      {/* Middle - Amount */}
      <div className="text-center">
        <div className="font-normal text-gray-900 text-lg">{price}¢</div>
      </div>

      {/* Right side - Checkbox and button */}
      <div className="flex items-center gap-6">
        <CheckCircle className="h-5 w-5 text-[#6558E8]" />
        <button
          onClick={() => handleSelect(market)}
          className={`px-6 py-2 rounded-full text-sm font-medium ${
            isSelect
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-[#6558E8] text-white hover:bg-purple-700'
          }`}
          disabled={isSelect}
        >
          {isSelect ? 'Selected' : 'Select'}
        </button>
      </div>
    </div>
  );
};
