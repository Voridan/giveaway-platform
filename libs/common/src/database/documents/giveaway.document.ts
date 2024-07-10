import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractDocument } from '../abstract.document';
import { SchemaTypes } from 'mongoose';
import { UserDocument } from './user.document';
import { UserSubdocumentSchema } from './user.subdocument';

@Schema({ versionKey: false, timestamps: { createdAt: true } })
export class GiveawayDocument extends AbstractDocument {
  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop()
  imageUrl: string;

  @Prop({ default: true })
  onModeration: boolean;

  @Prop({ default: false })
  ended: boolean;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User' })
  owner: UserDocument;

  @Prop({ type: [String] })
  participants: string[];

  @Prop({ type: [UserSubdocumentSchema] })
  partners: UserDocument[];
}

export const GiveawaySchema = SchemaFactory.createForClass(GiveawayDocument);
