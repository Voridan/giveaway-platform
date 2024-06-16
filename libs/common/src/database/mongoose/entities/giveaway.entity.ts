import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractDocument } from '../abstract.document';
import { SchemaTypes } from 'mongoose';
import { UserDocument } from './user.entity';

@Schema({ versionKey: false, timestamps: { createdAt: true, updatedAt: true } })
export class GiveawayDocument extends AbstractDocument {
  @Prop({ required: true })
  title: string;

  @Prop()
  imageUrl: string;

  @Prop({ required: true })
  price: number;

  @Prop({ default: true })
  onModeration: boolean;

  @Prop({ default: false })
  ended: boolean;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User' })
  owner: UserDocument;

  @Prop({ type: [String], default: [] })
  participants: string[];

  @Prop({ type: [{ type: SchemaTypes.ObjectId, ref: 'User' }] })
  partners: UserDocument[];
}

export const GiveawaySchema = SchemaFactory.createForClass(GiveawayDocument);
