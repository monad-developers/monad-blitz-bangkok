import { IPolyMarket } from '@/types/poly.types';
import { polyGetPrice } from '@/utils/poly-utils';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PredictionCardProps {
  marketsList: IPolyMarket[];
  market: IPolyMarket;
  className?: string;
  isYesNo?: boolean;
}

export const PredictionCardMarket = ({
  className = '',
  market,
  isYesNo = false,
}: PredictionCardProps) => {
  const price = polyGetPrice(market);
  const priceNo = (100 - price).toFixed(2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className={`relative ${className}`}
    >
      {/* <div className="flex items-center space-x-2">
        <h3 className="text-lg text-gray-900">{market}</h3>
      </div> */}
      {!isYesNo ? (
        <div className="flex items-center space-x-1">
          {/* <span className="text-[#535862]">{marketPercentage}%</span> */}
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="text-green-600">{market.groupItemTitle}</span>
          <b className="text-[#4F45B5]">{price.toFixed(2)}¢</b>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Button variant="yes" className="rounded-2xl">
            YES {price.toFixed(2)}¢
          </Button>
          <Button variant="no" className="rounded-2xl">
            NO {priceNo}¢
          </Button>
        </div>
      )}
    </motion.div>
  );
};
