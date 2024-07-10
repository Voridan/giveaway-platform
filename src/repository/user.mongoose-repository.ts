import { GenericMongooseRepository, UserDocument } from '@app/common';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

export class UserMongooseRepository extends GenericMongooseRepository<UserDocument> {
  protected readonly logger = new Logger(UserMongooseRepository.name);

  constructor(@InjectModel(UserDocument.name) userModel: Model<UserDocument>) {
    super(userModel);
  }
}
