import { GenericMongooseRepository, GiveawayDocument } from '@app/common';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

export class GiveawayMongooseRepository extends GenericMongooseRepository<GiveawayDocument> {
  protected logger: Logger;

  constructor(
    @InjectModel(GiveawayDocument.name) giveawayModel: Model<GiveawayDocument>,
  ) {
    super(giveawayModel);
  }
}
