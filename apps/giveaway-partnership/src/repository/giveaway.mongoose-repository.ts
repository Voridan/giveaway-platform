import { GenericMongooseRepository, GiveawayDocument } from '@app/common';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, isValidObjectId, Model, Types } from 'mongoose';

export class GiveawayMongooseRepository extends GenericMongooseRepository<GiveawayDocument> {
  protected readonly logger = new Logger(GiveawayMongooseRepository.name);

  constructor(
    @InjectModel(GiveawayDocument.name) giveawayModel: Model<GiveawayDocument>,
  ) {
    super(giveawayModel);
  }

  getResults(filterQuery: FilterQuery<GiveawayDocument>) {
    return this.model
      .findOne(filterQuery)
      .select({
        _id: 0,
        participants: 1,
        winner: 1,
      })
      .lean()
      .exec();
  }

  searchGiveaways(query: string) {
    return this.model.aggregate([
      {
        $match: {
          $text: {
            $search: query,
            $caseSensitive: false,
            $diacriticSensitive: false,
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

  searchGiveawaysAtlas(query: string) {
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

  async getUnmoderatedByLastId(limit: number, lastItemId: string) {
    const filter: FilterQuery<GiveawayDocument> = { onModeration: true };
    if (isValidObjectId(lastItemId))
      filter['_id'] = { $gt: new Types.ObjectId(lastItemId) };

    const [result] = await this.model.aggregate([
      {
        $facet: {
          giveaways: [
            { $match: filter },
            { $sort: { _id: 1 } },
            { $limit: limit },
          ],
          totalCount: [{ $count: 'count' }],
        },
      },
    ]);

    return [result.giveaways, result.totalCount[0].count];
  }

  async getOwnGiveaways(userId: string, offset: number, limit: number) {
    const filter: FilterQuery<GiveawayDocument> = {
      'owner.userId': new Types.ObjectId(userId),
    };

    const [result] = await this.model.aggregate([
      {
        $facet: {
          giveaways: [
            { $match: filter },
            { $sort: { _id: 1 } },
            { $skip: offset },
            { $limit: limit },
          ],
          totalCount: [{ $count: 'count' }],
        },
      },
    ]);

    return [result.giveaways, result.totalCount[0].count];
  }
}
