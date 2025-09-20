import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TagDocument = HydratedDocument<Tag>;

@Schema({
  collection: 'tags',
  toJSON: {
    transform: function (doc, ret) {
      const { _id, __v, ...rest } = ret;
      return rest;
    },
  },
  timestamps: true,
})
export class Tag {
  @Prop({ type: String, required: true, unique: true, index: true })
  id: string;

  @Prop({ type: String, required: true })
  label: string;

  @Prop({ type: String, required: true })
  slug: string;

  @Prop({ type: Boolean, default: false })
  forceShow: boolean;

  @Prop({ type: Date })
  deletedAt?: Date;
}

export const TagSchema = SchemaFactory.createForClass(Tag);
