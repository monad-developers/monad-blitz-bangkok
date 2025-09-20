import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TestDocument = HydratedDocument<Test>;

@Schema({
  collection: 'tests',
})
export class Test {
  @Prop({ type: String, required: true, unique: true, index: true })
  id: string;

  @Prop({ type: Date })
  deletedAt?: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;
}

export const TestSchema = SchemaFactory.createForClass(Test);
