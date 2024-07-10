import { getApproveMail } from './util/get-approve-mail';
import {
  BadRequestException,
  HttpException,
  Inject,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { CreateGiveawayDto } from './dto/create-giveaway.dto';
import { UpdateGiveawayDto } from './dto/update-giveaway.dto';
import { GiveawayResultDto } from './dto/giveaway-result.dto';
import { ClientProxy } from '@nestjs/microservices';
import { ParticipantsSourceDto } from './dto/participants-source.dto';
import { CollectCommentsEvent } from './events/collect-comments.event';
import { AddParticipantsDto } from './dto/add-participants.dto';
import { UsersService } from 'src/users/users.service';
import { FindOptionsRelations } from 'typeorm';
import { MailService } from 'src/mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { getDeclineMail } from './util/get-decline-mail';
import { GiveawayMongooseRepository } from 'src/repository/giveaway.mongoose-repository';

@Injectable()
export class GiveawaysService {
  constructor(
    private readonly giveawayRepo: GiveawayMongooseRepository,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
    private readonly config: ConfigService,
    @Inject('participants-microservice')
    private readonly participantsClient: ClientProxy,
  ) {}

  // async create(giveawayDto: CreateGiveawayDto, userId: string) {
  //   const owner = await this.usersService.findById(userId);
  //   const { title, description, postUrl, participants, partnerIds } =
  //     giveawayDto;

  //   const giveaway = new Giveaway({ owner, title });

  //   if (description) giveaway.description = description;
  //   if (postUrl) giveaway.postUrl = postUrl;
  //   if (participants) {
  //     try {
  //       const participantsEntity = this.mapParticipantsToEntity(participants);
  //       giveaway.participantsCount = participantsEntity.length;
  //       giveaway.participants = participantsEntity;
  //     } catch (error) {
  //       throw new HttpException(
  //         'Error when saving to the DB. ' + error.message,
  //         500,
  //       );
  //     }
  //   }

  //   if (partnerIds) {
  //     const ids = partnerIds.trim().split(' ').map(Number);
  //     try {
  //       const partners = await this.usersService.findManyById(ids);
  //       giveaway.partners = partners;
  //     } catch (error) {
  //       throw new HttpException(
  //         'Error when getting partners. ' + error.message,
  //         500,
  //       );
  //     }
  //   }

  //   return this.giveawayRepo.save(giveaway);
  // }

  // async moderateApprove(id: string) {
  //   const updated = await this.giveawayRepo.findOneAndUpdate(
  //     { id },
  //     { onModeration: false },
  //     { owner: true },
  //   );
  //   const owner = updated.owner;

  //   const mail = getApproveMail(owner.email, updated.title);
  //   await this.mailService.sendEmail({
  //     from: this.config.get<string>('APP_MAIL'),
  //     to: owner.email,
  //     subject: 'Moderation',
  //     html: mail,
  //   });

  //   return updated;
  // }

  // async moderateDelete(id: string) {
  //   const toDelete = await this.giveawayRepo.findOne({ id }, { owner: true });
  //   if (!toDelete) throw new NotFoundException('Giveaway not found');

  //   await this.remove(toDelete.id);
  //   const owner = toDelete.owner;

  //   const mail = getDeclineMail(owner.email, toDelete.title);
  //   await this.mailService.sendEmail({
  //     from: this.config.get<string>('APP_MAIL'),
  //     to: owner.email,
  //     subject: 'Moderation',
  //     html: mail,
  //   });

  //   return toDelete;
  // }

  // async findById(id: string) {
  //   const giveaway = await this.giveawayRepo.findOne(
  //     { id },
  //     { partners: true },
  //   );
  //   giveaway.partners = giveaway.partners.filter(
  //     (partner) => partner.id !== giveaway.ownerId,
  //   );
  //   return giveaway;
  // }

  // async update(id: string, body: UpdateGiveawayDto) {
  //   const { title, description, participants, partnersIds, postUrl } = body;
  //   const updateObj: Partial<Giveaway> = {};

  //   if (title) updateObj.title = title;
  //   if (description) updateObj.description = description;
  //   if (postUrl) updateObj.postUrl = postUrl;

  //   const relationsToUpdate: FindOptionsRelations<Giveaway> = {};
  //   relationsToUpdate.participants = !!participants;
  //   relationsToUpdate.partners = !!partnersIds;

  //   let updated: Giveaway;
  //   if (Object.keys(updateObj).length !== 0) {
  //     updated = await this.giveawayRepo.findOneAndUpdate(
  //       { id },
  //       updateObj,
  //       relationsToUpdate,
  //     );
  //   } else {
  //     updated = await this.giveawayRepo.findOne({ id }, relationsToUpdate);
  //   }

  //   if (relationsToUpdate.participants) {
  //     const participantsEntity = this.mapParticipantsToEntity(participants);
  //     updated.participants.push(...participantsEntity);
  //     updated.participantsCount += participantsEntity.length;
  //     updated = await this.giveawayRepo.save(updated);
  //   }

  //   if (relationsToUpdate.partners) {
  //     const ids = partnersIds.trim().split(' ').map(Number);
  //     try {
  //       const partners = await this.usersService.findManyById(ids);
  //       updated.partners = partners;
  //       updated = await this.giveawayRepo.save(updated);
  //     } catch (error) {
  //       throw new HttpException(
  //         'Error when getting partners. ' + error.message,
  //         500,
  //       );
  //     }
  //   }
  //   console.log(updated);

  //   return updated;
  // }

  async end(id: string) {
    return this.giveawayRepo.findOneAndUpdate({ id }, { ended: true });
  }

  // async remove(id: string) {
  //   return this.giveawayRepo.findOneAndDelete({ id });
  // }

  // async getResult(id: string) {
  //   const giveaway = await this.giveawayRepo.findOne(
  //     { id },
  //     {
  //       participants: true,
  //       winner: true,
  //     },
  //   );

  //   const results = new GiveawayResultDto();
  //   results.participants = giveaway.participants.map((p) => p.nickname);
  //   results.winner = giveaway.winner?.nickname || '';

  //   return results;
  // }

  // async collectParticipants(
  //   participantsSourceDto: ParticipantsSourceDto,
  //   ownerId: string,
  // ) {
  //   const id = participantsSourceDto.giveawayId;
  //   const giveaway = await this.giveawayRepo.findOne({ id }, { owner: true });

  //   if (giveaway.owner?.id !== ownerId) {
  //     throw new BadRequestException('User does not have such giveaway');
  //   }
  //   if (giveaway.onModeration) {
  //     throw new BadRequestException('Giveaway is on moderation stage');
  //   }
  //   if (giveaway.ended) {
  //     throw new BadRequestException('Giveaway has ended');
  //   }

  //   this.participantsClient.emit(
  //     'collect-comments',
  //     new CollectCommentsEvent(giveaway, participantsSourceDto.postUrl),
  //   );
  // }

  // async addParticipants(id: string, addParticipantsDto: AddParticipantsDto) {
  //   const giveaway = await this.giveawayRepo.findOne({ id });
  //   const participants = this.mapParticipantsToEntity(addParticipantsDto.data);
  //   giveaway.participants.push(...participants);
  //   giveaway.participantsCount += participants.length;
  //   return this.giveawayRepo.save(giveaway);
  // }

  // searchGiveaways(query: string) {
  //   return this.giveawayRepo.searchGiveaways(query);
  // }

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

  // private mapParticipantsToEntity(participantsStr: string) {
  //   const participants = participantsStr.trim().split(' ');
  //   return participants.map((nickname) => new Participant({ nickname }));
  // }
}
