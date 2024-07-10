import { GenericMongooseRepository, UserDocument } from '@app/common';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

export class UserMongooseRepository extends GenericMongooseRepository<UserDocument> {
  protected logger: Logger;

  constructor(@InjectModel(UserDocument.name) userModel: Model<UserDocument>) {
    super(userModel);
  }
}
