import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type MarketDocument = HydratedDocument<Market>;

export enum UmaResolutionStatuses {
  PROPOSED = 'proposed',
  RESOLVED = 'resolved',
}

@Schema({
  collection: 'markets',
  toJSON: {
    transform: function (doc, ret) {
      const { _id, __v, ...rest } = ret;
      return rest;
    },
  },
  timestamps: true,
})
export class Market {
  @Prop({ type: String, required: true, unique: true, index: true })
  id: string;

  @Prop({ type: String, default: '' })
  question: string;

  @Prop({ type: String, required: true })
  slug: string;

  @Prop({ type: Date, default: null })
  endDate: Date;

  @Prop({ type: Number, default: 0 })
  liquidity: number;

  @Prop({ type: Date, default: null })
  startDate: Date;

  @Prop({ type: String, default: null })
  image: string;

  @Prop({ type: String, default: null })
  icon: string;

  @Prop({ type: String, default: null })
  description: string;

  // Yes / No
  @Prop({ type: [String], required: true })
  outcomes: string[];

  // main Yes / No
  @Prop({ type: [String], required: true })
  outcomePrices: string[];

  @Prop({ type: String, required: true })
  volume: string;

  @Prop({ type: Boolean, required: true })
  active: boolean;

  @Prop({ type: Boolean, required: true })
  closed: boolean;

  @Prop({ type: Boolean, required: true })
  new: boolean;

  @Prop({ type: Boolean, required: true })
  featured: boolean;

  @Prop({ type: Boolean, required: true })
  archived: boolean;

  @Prop({ type: String, default: null })
  resolvedBy: string;

  @Prop({ type: Boolean, required: true })
  restricted: boolean;

  @Prop({ type: String, default: null })
  groupItemTitle: string;

  @Prop({ type: String, default: null })
  groupItemThreshold: string;

  @Prop({ type: Boolean, required: true })
  enableOrderBook: boolean;

  @Prop({ type: Number, default: 0 })
  orderPriceMinTickSize: number;

  @Prop({ type: Number, default: 0 })
  orderMinSize: number;

  @Prop({ type: Number, default: 0 })
  volumeNum: number;

  @Prop({ type: Number, default: 0 })
  liquidityNum: number;

  @Prop({ type: String, default: null })
  endDateIso: string;

  @Prop({ type: String, default: null })
  startDateIso: string;

  @Prop({ type: Boolean, default: null })
  hasReviewedDates: boolean;

  @Prop({ type: Number, default: 0 })
  volume24hr: number;

  @Prop({ type: Number, default: 0 })
  volume1wk: number;

  @Prop({ type: Number, default: 0 })
  volume1mo: number;

  @Prop({ type: Number, default: 0 })
  volume1yr: number;

  @Prop({ type: Number, default: 0 })
  lastTradePrice: number;

  @Prop({ type: Number, default: 0 })
  bestBid: number;

  @Prop({ type: Number, default: 0 })
  bestAsk: number;

  @Prop({
    type: [String],
    enum: UmaResolutionStatuses,
    default: [],
  })
  umaResolutionStatuses: UmaResolutionStatuses[];

  // --------------------------------------

  // adding
  @Prop({ type: Boolean, required: true })
  isProposed: boolean;

  @Prop({ type: Boolean, required: true })
  isResolved: boolean;

  // Yes / No
  @Prop({ type: String, default: null })
  resolvedOutcome: string;

  @Prop({ type: Number, default: 0 })
  volume24hrOur: number;

  @Prop({ type: Number, default: 0 })
  volume1wkOur: number;

  @Prop({ type: Number, default: 0 })
  volume1moOur: number;

  @Prop({ type: Number, default: 0 })
  volume1yrOur: number;

  @Prop({ type: Number, default: 0 })
  lastTradePriceOur: number;

  @Prop({ type: Number, default: 0 })
  bestBidOur: number;

  @Prop({ type: Number, default: 0 })
  bestAskOur: number;

  // --------------------------------------

  @Prop({ type: Date, default: null })
  deletedAt: Date;
}

export const MarketSchema = SchemaFactory.createForClass(Market);
