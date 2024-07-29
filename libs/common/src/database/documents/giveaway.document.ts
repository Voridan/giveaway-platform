import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractDocument } from '../abstract.document';
import { UserSubdocument, UserSubdocumentSchema } from './user.subdocument';

@Schema({
  versionKey: false,
  timestamps: { createdAt: true },
})
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

  @Prop()
  postUrl: string;

  @Prop()
  winner: string;

  @Prop({ default: 0 })
  participantsCount: number;

  @Prop({ type: UserSubdocumentSchema })
  owner: UserSubdocument;

  @Prop({ type: [String] })
  participants: string[];

  @Prop({ type: [UserSubdocumentSchema] })
  partners: UserSubdocument[];
}

export const GiveawaySchema = SchemaFactory.createForClass(GiveawayDocument);
GiveawaySchema.index({ title: 'text', description: 'text' });
GiveawaySchema.index({ owner: 1 });
