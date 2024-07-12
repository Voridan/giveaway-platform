import { getApproveMail } from './util/get-approve-mail';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateGiveawayDto } from './dto/create-giveaway.dto';
import { UpdateGiveawayDto } from './dto/update-giveaway.dto';
import { GiveawayResultDto } from './dto/giveaway-result.dto';
import { ClientProxy } from '@nestjs/microservices';
import { ParticipantsSourceDto } from './dto/participants-source.dto';
import { CollectCommentsEvent } from './events/collect-comments.event';
import { AddParticipantsDto } from './dto/add-participants.dto';
import { UsersService } from 'src/users/users.service';
import { MailService } from 'src/mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { getDeclineMail } from './util/get-decline-mail';
import { GiveawayMongooseRepository } from 'src/repository/giveaway.mongoose-repository';
import { GiveawayDocument, UserSubdocument } from '@app/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class GiveawaysService {
  constructor(
    private readonly giveawayRepo: GiveawayMongooseRepository,
    @InjectModel(UserSubdocument.name)
    private readonly userSubdocumentModel: Model<UserSubdocument>,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
    private readonly config: ConfigService,
    @Inject('participants-microservice')
    private readonly participantsClient: ClientProxy,
  ) {}

  async create(giveawayDto: CreateGiveawayDto, userId: string) {
    const owner = await this.usersService.findById(userId);
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
    if (giveawayDto.partnersIds) {
      const idsArray = giveawayDto.partnersIds.trim().split(' ');
      const partnersDocs = await this.usersService.findManyById(idsArray);
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

    return this.giveawayRepo.create(createObj);
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

  async update(_id: string, body: UpdateGiveawayDto) {
    const { title, description, participants, partnersIds, postUrl } = body;
    const partnerDocuments = await this.usersService.findManyById(
      partnersIds?.trim().split(' '),
    );

    const partnerSubDocuments = partnerDocuments?.map(
      (userDoc) =>
        new this.userSubdocumentModel({
          userId: userDoc._id,
          email: userDoc.email,
          userName: userDoc.userName,
        }),
    );

    const participantsArr = [...new Set(participants?.trim().split(' '))];

    return this.giveawayRepo.findOneAndUpdate(
      { _id },
      {
        title,
        description,
        partners: partnerSubDocuments,
        postUrl,
        $inc: { participantsCount: participantsArr.length },
        $push: { participants: participantsArr },
      },
    );
  }

  async end(_id: string) {
    return this.giveawayRepo.findOneAndUpdate({ _id }, { ended: true });
  }

  async remove(_id: string) {
    return this.giveawayRepo.deleteOne({ _id });
  }

  async getResult(_id: string) {
    const giveaway = await this.giveawayRepo.findOne({ _id });
    return { winner: giveaway.winner, participants: giveaway.participants };
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
      new CollectCommentsEvent(
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
        $push: { participants },
        $inc: { participantsCount: participants.length },
      },
    );
  }

  searchGiveaways(query: string) {
    return this.giveawayRepo.searchGiveaways(query);
  }

  // async getUnmoderatedGiveaways(
  //   limit: number,
  //   lastItemId: number,
  //   relations: string[] = [],
  // ) {
  //   if (lastItemId !== undefined && lastItemId > 0) {
  //     const item = await this.giveawayRepo.findOne({ id: lastItemId });
  //     if (!item) {
  //       throw new NotFoundException('Last item id is invalid.');
  //     }
  //   }

  //   return this.giveawayRepo.getUnmoderatedByLastId(
  //     limit,
  //     lastItemId,
  //     relations,
  //   );
  // }

  // async getPartneredPaginatedGiveaways(
  //   partnerId: number,
  //   offset: number,
  //   limit: number,
  //   next: boolean,
  //   lastItemId: number,
  //   relations: string[] = [],
  // ) {
  //   if (lastItemId !== undefined) {
  //     const item = await this.giveawayRepo.findOne({ id: lastItemId });
  //     if (!item) {
  //       throw new NotFoundException('Last item id is invalid.');
  //     }
  //   }

  //   const offset = (page - 1) * limit;
  //   return this.giveawayRepo.getPartneredGiveaways(
  //     partnerId,
  //     offset,
  //     limit,
  //     lastItemId,
  //     [],
  //   );
  // }

  // async getOwnPaginatedGiveaways(
  //   userId: number,
  //   offset: number,
  //   limit: number,
  //   next: boolean,
  //   lastItemId: number,
  //   relations: string[] = [],
  // ) {
  //   if (lastItemId !== undefined) {
  //     const item = await this.giveawayRepo.findOne({ id: lastItemId });
  //     if (!item) {
  //       throw new NotFoundException('Last item id is invalid.');
  //     }
  //   }

  //   return this.giveawayRepo.getOwnGiveaways(
  //     userId,
  //     offset,
  //     limit,
  //     next,
  //     lastItemId,
  //     relations,
  //   );
  // }
}
