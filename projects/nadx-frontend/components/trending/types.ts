export interface PredictionOption {
  id: string;
  range: string;
  volume: string;
  percentage: number;
  amount: string;
  selected: boolean;
}

export interface TrendingPrediction {
  id: string;
  title: string;
  description: string;
  volume: string;
  percentage: number;
  isLive: boolean;
  logo: string;
  tags: string[];
  predictionOptions: PredictionOption[];
}
