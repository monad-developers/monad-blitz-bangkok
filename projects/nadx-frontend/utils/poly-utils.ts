import { IPolyMarket } from '@/types/poly.types';

export const polyGetActiveMarket = (markets: IPolyMarket[]) => {
  return markets
    .filter(
      (m) => m.active && !m.isResolved && polyGetPrice(m).toFixed(0) !== '100'
    )
    .sort((a, b) => {
      const aPrice = polyGetPrice(a);
      const bPrice = polyGetPrice(b);
      return bPrice - aPrice;
    });
};

export const polyGetTotalVolume = (markets: IPolyMarket[]) => {
  return markets.reduce((acc, m) => acc + +m.volume, 0);
};

export const polyGetPrice = (markets: IPolyMarket) => {
  if (!markets) return 0;
  return +markets.outcomePrices[0] * 100;
};

export const polyGetPercentage = (
  markets: IPolyMarket,
  totalVolume: number
) => {
  if (!markets) return '0.00';
  return ((+markets.volume / totalVolume) * 100).toFixed(2);
};

export const getBarChartData = (markets?: IPolyMarket[]) => {
  if (!markets) return [];
  const totalVolume = markets.reduce((acc, market) => acc + +market.volume, 0);
  return markets
    .map((market) => {
      const chance = polyGetPrice(market);

      // console.log(`${market.groupItemTitle} : ${chance}`);

      return {
        name: market.groupItemTitle || '',
        percent: chance,
        a: chance * 100,
        b: chance / 2,
        c: 100 / 4,
      };
    })
    .sort((a, b) => b.a - a.a)
    .splice(0, 8);
};
