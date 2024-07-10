import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class UserSubdocument extends Document {
  @Prop({ required: true })
  username: string;

  @Prop({ required: true })
  email: string;
}

export const UserSubdocumentSchema =
  SchemaFactory.createForClass(UserSubdocument);
