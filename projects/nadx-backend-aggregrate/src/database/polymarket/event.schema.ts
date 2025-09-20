import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Market } from 'src/database/polymarket/market.schema';
import { Tag } from 'src/database/polymarket/tag.schema';

export type EventDocument = HydratedDocument<Event>;

@Schema({
  collection: 'events',
  toJSON: {
    transform: function (doc, ret) {
      const { _id, __v, ...rest } = ret;
      return rest;
    },
  },
  timestamps: true,
})
export class Event {
  @Prop({ type: String, default: null, unique: true, index: true })
  id: string;

  @Prop({ type: String, default: null })
  ticker: string;

  @Prop({ type: String, default: null })
  slug: string;

  @Prop({ type: String, default: null })
  title: string;

  @Prop({ type: String, default: null })
  description?: string;

  @Prop({ type: Date, default: null })
  startDate: Date;

  @Prop({ type: Date, default: null })
  creationDate: Date;

  @Prop({ type: Date, default: null })
  endDate: Date;

  @Prop({ type: String, default: null })
  image: string;

  @Prop({ type: String, default: null })
  icon: string;

  @Prop({ type: Boolean, required: true })
  active: boolean;

  @Prop({ type: Boolean, required: true })
  closed: boolean;

  @Prop({ type: Boolean, required: true })
  archived: boolean;

  @Prop({ type: Boolean, required: true })
  new: boolean;

  @Prop({ type: Boolean, required: true })
  featured: boolean;

  @Prop({ type: Boolean, required: true })
  restricted: boolean;

  @Prop({ type: Number, default: 0 })
  liquidity: number;

  @Prop({ type: Number, default: 0 })
  volume: number;

  @Prop({ type: Number, default: 0 })
  competitive: number;

  @Prop({ type: Number, default: 0 })
  volume24hr: number;

  @Prop({ type: Number, default: 0 })
  volume1wk: number;

  @Prop({ type: Number, default: 0 })
  volume1mo: number;

  @Prop({ type: Number, default: 0 })
  volume1yr: number;

  @Prop({ type: Boolean, required: true })
  enableOrderBook: boolean;

  @Prop({ type: Number, default: 0 })
  liquidityClob: number;

  @Prop({ type: Number, default: 0 })
  commentCount: number;

  @Prop({ type: String, default: null })
  seriesSlug: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: Tag.name }], default: [] })
  tags: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: Market.name }], default: [] })
  markets: Types.ObjectId[];

  // add
  @Prop({ type: Types.ObjectId, ref: Tag.name, default: null })
  ourTagId: Types.ObjectId;

  @Prop({ type: Date })
  deletedAt?: Date;
}

export const EventSchema = SchemaFactory.createForClass(Event);
