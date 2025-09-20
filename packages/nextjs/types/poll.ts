// Enhanced Poll interface with betting market integration
export interface Poll {
  // Original poll data
  _id: string;
  description: string;
  category: string;
  verifierRule: string;
  createdBy: string;
  totalVotes: number;
  yesVotes: number;
  noVotes: number;
  likes?: number;
  dislikes?: number;
  createdAt: string;
  expiresAt?: string;
  status: string;
  twitterPostId?: string;
  updatedAt: string;

  // Betting market data
  marketAddress?: string;
  marketExists: boolean;

  // Market statistics (from blockchain)
  marketStats?: {
    totalYesBets: string;
    totalNoBets: string;
    totalBets: number;
    isSettled: boolean;
    winner?: boolean;
    betAmount: string; // Fixed bet amount (0.01 MON)
  };

  // Current odds and profit calculations
  odds?: {
    yesOdds: number;
    noOdds: number;
    yesPercentage: number;
    noPercentage: number;
  };

  // User-specific betting data
  userBets?: {
    hasVoted: boolean;
    betOnYes?: boolean;
    yesAmount: string;
    noAmount: string;
    totalAmount: string;
    canClaim: boolean;
    claimAmount?: string;
  };

  // Profit calculation for potential bets
  profitCalculation?: {
    yesProfit: string;
    noProfit: string;
    yesPotentialWinnings: string;
    noPotentialWinnings: string;
  };
}

// Market creation data for new polls
export interface CreatePollMarketData {
  pollId: string;
  question: string;
  createdBy: string;
}

// Betting action types
export type BetDirection = "yes" | "no";

// Betting result from API
export interface BettingResult {
  success: boolean;
  txHash?: string;
  message: string;
  marketAddress?: string;
  betDirection?: BetDirection;
  amount?: string;
}

// Market statistics response
export interface MarketStatsResponse {
  success: boolean;
  data?: {
    address: string;
    question: string;
    creator: string;
    totalYesBets: string;
    totalNoBets: string;
    totalBets: number;
    isSettled: boolean;
    winner?: boolean;
  };
}

// Profit calculation response
export interface ProfitCalculationResponse {
  success: boolean;
  data?: {
    marketAddress: string;
    betOnYes: boolean;
    betAmount: string;
    potentialWinnings: string;
    profitIfWin: string;
    currentOdds: {
      yesOdds: number;
      noOdds: number;
    };
    marketShare: {
      yesPercentage: number;
      noPercentage: number;
    };
  };
}

// Enhanced poll with all betting data populated
export interface EnhancedPoll extends Poll {
  marketStats: NonNullable<Poll["marketStats"]>;
  odds: NonNullable<Poll["odds"]>;
  userBets: NonNullable<Poll["userBets"]>;
  profitCalculation: NonNullable<Poll["profitCalculation"]>;
}
