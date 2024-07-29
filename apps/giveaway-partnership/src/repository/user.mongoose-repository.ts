import {
  GenericMongooseRepository,
  GiveawayDocument,
  UserDocument,
} from '@app/common';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';

export class UserMongooseRepository extends GenericMongooseRepository<UserDocument> {
  protected readonly logger = new Logger(UserMongooseRepository.name);

  constructor(@InjectModel(UserDocument.name) userModel: Model<UserDocument>) {
    super(userModel);
  }

  async getOwnGiveaways(
    userId: string,
    offset: number,
    limit: number,
    lastItemId: string | undefined,
    forward: boolean,
  ) {
    const paginatedGiveawaysStages: PipelineStage[] = [
      { $unwind: '$ownGiveawaysDetails' },
    ];
    if (lastItemId) {
      paginatedGiveawaysStages.push({
        $match: {
          'ownGiveawaysDetails._id': forward
            ? { $gt: new Types.ObjectId(lastItemId) }
            : { $lt: new Types.ObjectId(lastItemId) },
        },
      });
    }
    paginatedGiveawaysStages.push({
      $sort: { 'ownGiveawaysDetails._id': forward ? 1 : -1 },
    });
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
            ...paginatedGiveawaysStages,
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
        ? (result.paginatedGiveaways[0].giveaways as GiveawayDocument[])
        : [];
    const totalCount =
      result.totalCount.length > 0 ? result.totalCount[0].count : 0;

    !forward && giveaways.reverse();
    return [giveaways, totalCount];
  }

  async getPartneredGiveaways(
    partnerId: string,
    offset: number,
    limit: number,
    lastItemId: string,
    forward: boolean,
  ) {
    const paginatedGiveawaysStages: PipelineStage[] = [
      { $unwind: '$partneredGiveawayDetails' },
    ];
    if (lastItemId) {
      paginatedGiveawaysStages.push({
        $match: {
          'partneredGiveawayDetails._id': forward
            ? { $gt: new Types.ObjectId(lastItemId) }
            : { $lt: new Types.ObjectId(lastItemId) },
        },
      });
    }
    paginatedGiveawaysStages.push({
      $sort: { 'partneredGiveawayDetails._id': forward ? 1 : -1 },
    });
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
            ...paginatedGiveawaysStages,
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

    !forward && giveaways.reverse();
    return [giveaways, totalCount];
  }
}
