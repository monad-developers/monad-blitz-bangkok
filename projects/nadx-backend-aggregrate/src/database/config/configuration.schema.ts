import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ConfigurationDocument = HydratedDocument<Configuration>;

@Schema()
export class Configuration {
  @Prop({ type: String, required: true })
  key: string;

  @Prop({ type: String, required: true })
  description: string;

  @Prop({ type: String, required: false, default: '' })
  value: string;

  @Prop({ type: Date })
  deletedAt?: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;
}

export const ConfigurationSchema = SchemaFactory.createForClass(Configuration);
ConfigurationSchema.index({ key: 1 });
