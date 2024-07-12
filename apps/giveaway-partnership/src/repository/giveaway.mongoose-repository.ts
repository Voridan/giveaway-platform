import { GenericMongooseRepository, GiveawayDocument } from '@app/common';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

export class GiveawayMongooseRepository extends GenericMongooseRepository<GiveawayDocument> {
  protected readonly logger = new Logger(GiveawayMongooseRepository.name);

  constructor(
    @InjectModel(GiveawayDocument.name) giveawayModel: Model<GiveawayDocument>,
  ) {
    super(giveawayModel);
  }

  searchGiveaways(query: string) {
    return this.model.aggregate([
      {
        $search: {
          index: 'text_search',
          text: {
            query,
            path: {
              wildcard: '*',
            },
            fuzzy: {},
          },
        },
      },
      {
        $project: {
          _id: 1,
          title: 1,
          description: 1,
          imageUrl: 1,
          onModeration: 1,
          ended: 1,
          postUrl: 1,
          participantsCount: 1,
          score: {
            $meta: 'textScore',
          },
        },
      },
      { $limit: 10 },
      {
        $sort: {
          score: { $meta: 'textScore' },
        },
      },
    ]);
  }
}
