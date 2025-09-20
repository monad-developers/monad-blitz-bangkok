export interface IPolyEventResponse {
  events: IPolyEvent[];
  paginate: IPaginate;
}

export interface IPolyTagResponseItem extends IPolyTag {
  total: number;
}

export interface IPaginate {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface IPolyEvent {
  id: string;
  ticker: string;
  slug: string;
  title: string;
  description: string;
  startDate: string;
  creationDate: string;
  endDate: string;
  image: string;
  icon: string;
  active: boolean;
  closed: boolean;
  archived: boolean;
  new: boolean;
  featured: boolean;
  restricted: boolean;
  liquidity: number;
  volume: number;
  competitive: number;
  volume24hr: number;
  volume1wk: number;
  volume1mo: number;
  volume1yr: number;
  enableOrderBook: boolean;
  liquidityClob: number;
  commentCount: number;
  seriesSlug: null;
  tags: IPolyTag[];
  markets: IPolyMarket[];
  createdAt: string;
  updatedAt: string;

  ourTagId: IPolyTag;
}

export interface IPolyMarket {
  id: string;
  active: boolean;
  archived: boolean;
  bestAsk: number;
  bestAskOur: number;
  bestBid: number;
  bestBidOur: number;
  closed: boolean;
  createdAt: string;
  deletedAt: null;
  description: string;
  enableOrderBook: boolean;
  endDate: string;
  endDateIso: string;
  featured: boolean;
  groupItemThreshold: string;
  groupItemTitle: string;
  hasReviewedDates: boolean;
  icon: string;
  image: string;
  isProposed: boolean;
  isResolved: boolean;
  lastTradePrice: number;
  lastTradePriceOur: number;
  liquidity: number;
  liquidityNum: number;
  new: boolean;
  orderMinSize: number;
  orderPriceMinTickSize: number;
  outcomePrices: string[];
  outcomes: string[];
  question: string;
  resolvedBy: string;
  resolvedOutcome: null;
  restricted: boolean;
  slug: string;
  startDate: string;
  startDateIso: string;
  umaResolutionStatuses: string[];
  updatedAt: string;
  volume: string;
  volume1mo: number;
  volume1moOur: number;
  volume1wk: number;
  volume1wkOur: number;
  volume1yr: number;
  volume1yrOur: number;
  volume24hr: number;
  volume24hrOur: number;
  volumeNum: number;
}

export interface IPolyTag {
  id: string;
  label: string;
  slug: string;
  forceShow: boolean;
  createdAt: string;
  updatedAt: string;
}
