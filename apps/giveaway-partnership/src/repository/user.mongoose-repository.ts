import { GenericMongooseRepository, UserDocument } from '@app/common';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

export class UserMongooseRepository extends GenericMongooseRepository<UserDocument> {
  protected readonly logger = new Logger(UserMongooseRepository.name);

  constructor(@InjectModel(UserDocument.name) userModel: Model<UserDocument>) {
    super(userModel);
  }

  async getOwnGiveaways(userId: string, offset: number, limit: number) {
    const [result] = await this.model.aggregate([
      { $match: { _id: new Types.ObjectId(userId) } },
      {
        $lookup: {
          from: 'giveawaydocuments',
          localField: 'ownGiveaways',
          foreignField: '_id',
          as: 'ownGiveawaysDetails',
        },
      },
      {
        $project: {
          _id: 0,
          ownGiveawaysDetails: 1,
        },
      },
      {
        $facet: {
          paginatedGiveaways: [
            { $unwind: '$ownGiveawaysDetails' },
            { $sort: { 'ownGiveawaysDetails._id': 1 } },
            { $skip: offset },
            { $limit: limit },
            {
              $group: {
                _id: null,
                giveaways: { $push: '$ownGiveawaysDetails' },
              },
            },
            {
              $project: {
                _id: 0,
                giveaways: 1,
              },
            },
          ],
          totalCount: [
            { $unwind: '$ownGiveawaysDetails' },
            { $count: 'count' },
          ],
        },
      },
    ]);

    const giveaways =
      result.paginatedGiveaways.length > 0
        ? result.paginatedGiveaways[0].giveaways
        : [];
    const totalCount =
      result.totalCount.length > 0 ? result.totalCount[0].count : 0;

    return [giveaways, totalCount];
  }

  async getPartneredGiveaways(
    partnerId: string,
    offset: number,
    limit: number,
  ) {
    const [result] = await this.model.aggregate([
      { $match: { _id: new Types.ObjectId(partnerId) } },
      {
        $lookup: {
          from: 'giveawaydocuments',
          localField: 'partneredGiveaways',
          foreignField: '_id',
          as: 'partneredGiveawayDetails',
        },
      },
      {
        $project: {
          _id: 0,
          partneredGiveawayDetails: 1,
        },
      },
      {
        $facet: {
          giveaways: [
            { $unwind: '$partneredGiveawayDetails' },
            { $sort: { 'partneredGiveawayDetails._id': 1 } },
            { $skip: offset },
            { $limit: limit },
            {
              $group: {
                _id: null,
                giveaways: { $push: '$partneredGiveawayDetails' },
              },
            },
            {
              $project: {
                _id: 0,
                giveaways: 1,
              },
            },
          ],
          totalCount: [
            { $unwind: '$partneredGiveawayDetails' },
            { $count: 'count' },
          ],
        },
      },
    ]);

    const giveaways =
      result.giveaways.length > 0 ? result.giveaways[0].giveaways : [];
    const totalCount =
      result.totalCount.length > 0 ? result.totalCount[0].count : 0;

    return [giveaways, totalCount];
  }
}
