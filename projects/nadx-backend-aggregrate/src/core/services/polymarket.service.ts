import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { PolymarketEventResponseData } from 'src/core/types/polymarket.types';

export interface PolymarketMarket {
  id: string;
  question: string;
  description: string;
  outcomes: string[];
  outcomePrices: string[];
  volume: string;
  liquidity: string;
  endDate: string;
  resolvedOutcome?: string;
  active: boolean;
}

export interface MarketData {
  symbol: string;
  price: number;
  marketId: string;
  question: string;
  outcome: string;
  volume: number;
  liquidity: number;
}

@Injectable()
export class PolymarketService {
  private readonly baseUrl = 'https://gamma-api.polymarket.com';

  async fetchEvents({
    limit = 10,
    offset = 0,
    order = '',
    ascending = false,
    id = undefined,
    slug = undefined,
    closed = false,
    tag_id = undefined,
    active = true,
    archived = false,
  }: {
    limit?: number;
    offset?: number;
    order?: string;
    ascending?: boolean;
    id?: number;
    slug?: string;
    closed?: boolean;
    tag_id?: number;
    active?: boolean;
    archived?: boolean;
  }): Promise<PolymarketEventResponseData | undefined> {
    try {
      const response = await axios.get(`${this.baseUrl}/events/pagination`, {
        headers: {
          'Content-Type': 'application/json',
        },
        params: {
          limit,
          offset,
          order,
          ascending,
          id,
          slug,
          closed,
          tag_id,
          active,
          archived,
        },
      });

      const params = {
        limit,
        offset,
        order,
        ascending,
        closed,
        active,
        archived,
        id,
        slug,
        tag_id,
      };

      const queryString = Object.entries(params)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => `${key}=${value}`)
        .join('&');

      const requestURL = `${this.baseUrl}/events/pagination?${queryString}`;
      console.log({ requestURL });

      return response.data;
    } catch (error) {
      return undefined;
    }
  }

  async fetchAllMarkets(): Promise<PolymarketMarket[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/markets`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const markets: PolymarketMarket[] = response.data;
      return markets.filter((market) => market.active);
    } catch (error) {
      console.error('Error fetching markets:', error);
      throw error;
    }
  }

  transformToSymbolPrice(markets: PolymarketMarket[]): MarketData[] {
    const marketData: MarketData[] = [];

    markets.forEach((market) => {
      market.outcomes.forEach((outcome, index) => {
        const price = parseFloat(market.outcomePrices[index]) || 0;

        marketData.push({
          symbol: this.createSymbol(market.question, outcome),
          price: price,
          marketId: market.id,
          question: market.question,
          outcome: outcome,
          volume: parseFloat(market.volume) || 0,
          liquidity: parseFloat(market.liquidity) || 0,
        });
      });
    });

    return marketData;
  }

  private createSymbol(question: string, outcome: string): string {
    const cleanQuestion = question
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, '_')
      .toUpperCase()
      .substring(0, 20);

    const cleanOutcome = outcome
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, '_')
      .toUpperCase()
      .substring(0, 10);

    return `${cleanQuestion}_${cleanOutcome}`;
  }

  async getAllSymbolsAndPrices(): Promise<MarketData[]> {
    try {
      const markets = await this.fetchAllMarkets();
      return this.transformToSymbolPrice(markets);
    } catch (error) {
      console.error('Error fetching symbols and prices:', error);
      throw error;
    }
  }

  async fetchMarketById(marketId: string): Promise<PolymarketMarket | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/markets/${marketId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      console.error(`Error fetching market ${marketId}:`, error);
      throw error;
    }
  }

  async searchMarkets(keyword: string): Promise<MarketData[]> {
    try {
      const allMarkets = await this.getAllSymbolsAndPrices();
      const searchTerm = keyword.toLowerCase();

      return allMarkets.filter(
        (market) =>
          market.question.toLowerCase().includes(searchTerm) ||
          market.outcome.toLowerCase().includes(searchTerm),
      );
    } catch (error) {
      console.error('Error searching markets:', error);
      throw error;
    }
  }
}
