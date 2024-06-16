import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractDocument } from '../abstract.document';
import { SchemaTypes } from 'mongoose';
import { GiveawayDocument } from './giveaway.entity';

@Schema({ versionKey: false, timestamps: { createdAt: true, updatedAt: true } })
export class UserDocument extends AbstractDocument {
  @Prop({ required: true })
  userName: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  email: string;

  @Prop({ default: false })
  isAdmin: boolean;

  @Prop()
  resetPasswordToken?: string;

  @Prop()
  resetPasswordExpires?: Date;

  @Prop({ type: [{ type: SchemaTypes.ObjectId, ref: 'Giveaway' }] })
  ownGiveaways: GiveawayDocument[];

  @Prop({ type: [{ type: SchemaTypes.ObjectId, ref: 'Giveaway' }] })
  partnerInGiveaways: GiveawayDocument[];
}

export const UserSchema = SchemaFactory.createForClass(UserDocument);
