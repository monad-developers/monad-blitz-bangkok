import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

@Schema()
export class User {
  @Prop({ type: String, required: true })
  email: string;

  @Prop({ type: String, required: true })
  password: string;

  @Prop({ type: Boolean, required: true, default: false })
  isEmailVerified: boolean;

  @Prop({ type: Boolean, required: true, default: true })
  isEnabled: boolean;

  @Prop({ default: UserRole.USER })
  role: UserRole;

  @Prop({ type: Number, default: 10000 })
  remainingTokens: number;

  @Prop({ type: Number, default: 0 })
  tokensUsed: number;

  @Prop({ type: Date })
  deletedAt?: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
