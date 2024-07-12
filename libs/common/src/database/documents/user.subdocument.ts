import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';

@Schema()
export class UserSubdocument extends Document {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'UserDocument' })
  userId: string;

  @Prop({ required: true })
  userName: string;

  @Prop({ required: true })
  email: string;
}

export const UserSubdocumentSchema =
  SchemaFactory.createForClass(UserSubdocument);
