import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractDocument } from '../abstract.document';
import { SchemaTypes } from 'mongoose';
import { GiveawayDocument } from './giveaway.document';

@Schema({ versionKey: false, timestamps: { createdAt: true } })
export class UserDocument extends AbstractDocument {
  @Prop({ required: true })
  userName: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: false })
  isAdmin: boolean;

  @Prop()
  jwtRefreshTokenHash?: string;

  @Prop()
  resetPasswordToken?: string;

  @Prop()
  resetPasswordExpires?: Date;

  @Prop({
    type: [{ type: SchemaTypes.ObjectId, ref: 'GiveawayDocument' }],
  })
  ownGiveaways: GiveawayDocument[];

  @Prop({
    type: [{ type: SchemaTypes.ObjectId, ref: 'GiveawayDocument' }],
  })
  partneredGiveaways: GiveawayDocument[];
}

export const UserSchema = SchemaFactory.createForClass(UserDocument);
UserSchema.index({ userName: 1, email: 1 }, { unique: true });
