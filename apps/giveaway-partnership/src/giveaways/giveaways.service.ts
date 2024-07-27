import { getApproveMail } from './util/get-approve-mail';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateGiveawayDto } from './dto/create-giveaway.dto';
import { UpdateGiveawayDto } from './dto/update-giveaway.dto';
import { ClientProxy } from '@nestjs/microservices';
import { ParticipantsSourceDto } from './dto/participants-source.dto';
import { AddParticipantsDto } from './dto/add-participants.dto';
import { MailService } from '../mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { getDeclineMail } from './util/get-decline-mail';
import { GiveawayMongooseRepository } from '../repository/giveaway.mongoose-repository';
import { GiveawayDocument, UserDocument, UserSubdocument } from '@app/common';
import { Model, UpdateQuery } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CollectParticipantsEvent } from '@app/common/events/collect-participants.event';
import { UserMongooseRepository } from '../repository/user.mongoose-repository';

@Injectable()
export class GiveawaysService {
  constructor(
    private readonly giveawayRepo: GiveawayMongooseRepository,
    @InjectModel(UserSubdocument.name)
    private readonly userSubdocumentModel: Model<UserSubdocument>,
    private readonly usersRepo: UserMongooseRepository,
    private readonly mailService: MailService,
    private readonly config: ConfigService,
    @Inject('participants-microservice')
    private readonly participantsClient: ClientProxy,
  ) {}

  async create(userId: string, giveawayDto: CreateGiveawayDto) {
    const owner = await this.usersRepo.findOne({ _id: userId });
    const createObj: Partial<GiveawayDocument> = {
      title: giveawayDto.title,
      description: giveawayDto.description,
      postUrl: giveawayDto.postUrl,
      owner: new this.userSubdocumentModel({
        userId: owner._id,
        email: owner.email,
        userName: owner.userName,
      }),
    };

    if (giveawayDto.participants) {
      const participantsArray = giveawayDto.participants.trim().split(' ');
      createObj.participants = participantsArray;
      createObj.participantsCount = participantsArray.length;
    }

    let partnersDocs: UserDocument[] | null = null;
    if (giveawayDto.partnersIds) {
      const idsArray = giveawayDto.partnersIds.trim().split(' ');
      partnersDocs = await this.usersRepo.find({
        _id: { $in: idsArray },
      });
      const partners = partnersDocs.map(
        (userDoc) =>
          new this.userSubdocumentModel({
            userId: userDoc._id,
            email: userDoc.email,
            userName: userDoc.userName,
          }),
      );
      createObj.partners = partners;
    }

    const newGiveaway = await this.giveawayRepo.create(createObj);

    await this.usersRepo.updateOne(
      { _id: owner._id },
      {
        $push: { ownGiveaways: newGiveaway._id },
      },
    );
    if (partnersDocs && partnersDocs.length > 0) {
      await this.usersRepo.updateMany(
        {
          _id: { $in: partnersDocs.map((user) => user._id) },
        },
        {
          $push: { partneredGiveaways: newGiveaway._id },
        },
      );
    }

    return newGiveaway;
  }

  async update(_id: string, body: UpdateGiveawayDto) {
    const toUpdate = await this.giveawayRepo.findOne({ _id });
    const { title, description, participants, partnersIds, postUrl } = body;
    const idsSet = partnersIds
      ? new Set(partnersIds.trim().split(' '))
      : new Set([]);

    const updateQuery: UpdateQuery<GiveawayDocument> = {
      title,
      description,
      postUrl,
    };

    const oldPartnersIds = toUpdate.partners.map((partner) =>
      partner.userId.toString(),
    );
    const difference: string[] = [];

    if (idsSet) {
      for (const pId of oldPartnersIds) {
        console.log(`!${idsSet}.has(${pId})`, !idsSet.has(pId));

        if (!idsSet.has(pId)) {
          difference.push(pId);
        }
      }
    }
    console.log(difference);

    if (difference.length > 0) {
      await this.usersRepo.updateMany(
        { _id: { $in: difference } },
        { $pull: { partneredGiveaways: toUpdate._id } },
      );
    }

    if (idsSet) {
      const updatedPartnersId = [...idsSet.values()];
      const newPartnerDocuments = await this.usersRepo.find({
        _id: { $in: updatedPartnersId },
      });
      const partnerSubDocuments = newPartnerDocuments?.map(
        (userDoc) =>
          new this.userSubdocumentModel({
            userId: userDoc._id,
            email: userDoc.email,
            userName: userDoc.userName,
          }),
      );

      updateQuery.$set = { partners: partnerSubDocuments };
      await this.usersRepo.updateMany(
        {
          _id: { $in: updatedPartnersId },
        },
        { $push: { partneredGiveaways: toUpdate._id } },
      );
    }

    const participantsArr = [
      ...new Set([...(participants?.trim().split(' ') || [])]),
    ];

    updateQuery.$inc = { participantsCount: participantsArr.length };
    updateQuery.$push = { participants: { $each: participantsArr } };

    return this.giveawayRepo.findOneAndUpdate({ _id }, updateQuery);
  }

  async moderateApprove(_id: string) {
    const updated = await this.giveawayRepo.findOneAndUpdate(
      { _id },
      { onModeration: false },
    );

    const owner = updated.owner;

    const mail = getApproveMail(owner.email, updated.title);
    await this.mailService.sendEmail({
      from: this.config.get<string>('APP_MAIL'),
      to: owner.email,
      subject: 'Moderation',
      html: mail,
    });

    return updated;
  }

  async moderateDelete(_id: string) {
    const toDelete = await this.giveawayRepo.findOne({ _id });
    if (!toDelete) throw new NotFoundException('Giveaway not found');

    await this.giveawayRepo.deleteOne(toDelete._id);
    const owner = toDelete.owner;

    const mail = getDeclineMail(owner.email, toDelete.title);
    await this.mailService.sendEmail({
      from: this.config.get<string>('APP_MAIL'),
      to: owner.email,
      subject: 'Moderation',
      html: mail,
    });

    return toDelete;
  }

  async findById(_id: string) {
    const giveaway = await this.giveawayRepo.findOne({ _id }, ['partners']);
    return giveaway;
  }

  async end(_id: string) {
    return this.giveawayRepo.findOneAndUpdate({ _id }, { ended: true });
  }

  async remove(_id: string) {
    const toRemove = await this.giveawayRepo.findOne({ _id });
    if (!toRemove) {
      throw new BadRequestException('invalid id');
    }
    await this.usersRepo.updateOne(
      {
        _id: toRemove.owner.userId,
      },
      {
        $pull: {
          ownGiveaways: toRemove._id,
        },
      },
    );
    await this.usersRepo.updateMany(
      {
        _id: { $in: toRemove.partners.map((p) => p.userId) },
      },
      {
        $pull: {
          partneredGiveaways: toRemove._id,
        },
      },
    );
    return this.giveawayRepo.deleteOne({ _id });
  }

  async getResult(_id: string) {
    const results = await this.giveawayRepo.getResults({ _id });

    return {
      winner: results.winner || '',
      participants: results.participants,
    };
  }

  async collectParticipants(
    participantsSourceDto: ParticipantsSourceDto,
    ownerId: string,
  ) {
    const id = participantsSourceDto.giveawayId;
    const giveaway = await this.giveawayRepo.findOne({ id });

    if (giveaway.owner.userId !== ownerId) {
      throw new BadRequestException('User does not have such giveaway');
    }
    if (giveaway.onModeration) {
      throw new BadRequestException('Giveaway is on moderation stage');
    }
    if (giveaway.ended) {
      throw new BadRequestException('Giveaway has ended');
    }

    this.participantsClient.emit(
      'collect-comments',
      new CollectParticipantsEvent(
        giveaway._id.toString(),
        participantsSourceDto.postUrl,
      ),
    );
  }

  async addParticipants(_id: string, addParticipantsDto: AddParticipantsDto) {
    const participants = addParticipantsDto.data?.trim().split(' ');
    return this.giveawayRepo.findOneAndUpdate(
      { _id },
      {
        $push: { participants: { $each: participants } },
        $inc: { participantsCount: participants.length },
      },
    );
  }

  searchGiveaways(query: string) {
    return this.giveawayRepo.searchGiveawaysAtlas(query);
  }

  async getUnmoderatedGiveaways(limit: number, lastItemId: string) {
    try {
      return this.giveawayRepo.getUnmoderatedByLastId(limit, lastItemId);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getPartneredPaginatedGiveaways(
    partnerId: string,
    offset: number,
    limit: number,
  ) {
    return this.usersRepo.getPartneredGiveaways(partnerId, offset, limit);
  }

  async getOwnPaginatedGiveaways(
    userId: string,
    offset: number,
    limit: number,
  ) {
    try {
      return this.usersRepo.getOwnGiveaways(userId, offset, limit);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
