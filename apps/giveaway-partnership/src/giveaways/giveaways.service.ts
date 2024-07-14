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
import { GiveawayTypeOrmRepository } from '../repository/giveaway.typeorm-repository';
import { CollectParticipantsEvent, Giveaway, Participant } from '@app/common';
import { ClientProxy } from '@nestjs/microservices';
import { ParticipantsSourceDto } from './dto/participants-source.dto';
import { AddParticipantsDto } from './dto/add-participants.dto';
import { UsersService } from '../users/users.service';
import { FindOptionsRelations } from 'typeorm';
import { MailService } from '../mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { getDeclineMail } from './util/get-decline-mail';

@Injectable()
export class GiveawaysService implements OnModuleInit {
  constructor(
    private readonly giveawayRepo: GiveawayTypeOrmRepository,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
    private readonly config: ConfigService,
    @Inject('participants-microservice')
    private readonly participantsClient: ClientProxy,
  ) {}

  async onModuleInit() {
    const giveaways = await this.giveawayRepo.find(
      {},
      {
        participants: true,
      },
    );

    for (const giveaway of giveaways) {
      giveaway.participantsCount = giveaway.participants.length;
      await this.giveawayRepo.save(giveaway);
    }
    console.log('Updated participant counts for all giveaways on startup');
  }

  async create(giveawayDto: CreateGiveawayDto, userId: number) {
    const owner = await this.usersService.findById(userId);
    const { title, description, postUrl, participants, partnerIds } =
      giveawayDto;

    const giveaway = new Giveaway({ owner, title, description, postUrl });

    if (participants) {
      try {
        const participantsEntity = this.mapParticipantsToEntity(participants);
        giveaway.participantsCount = participantsEntity.length;
        giveaway.participants = participantsEntity;
      } catch (error) {
        throw new HttpException(
          'Error when saving to the DB. ' + error.message,
          500,
        );
      }
    }

    if (partnerIds) {
      const ids = partnerIds.trim().split(' ').map(Number);
      try {
        const partners = await this.usersService.findManyById(ids);
        giveaway.partners = partners;
      } catch (error) {
        throw new HttpException(
          'Error when getting partners. ' + error.message,
          500,
        );
      }
    }

    return this.giveawayRepo.save(giveaway);
  }

  async moderateApprove(id: number) {
    const updated = await this.giveawayRepo.findOneAndUpdate(
      { id },
      { onModeration: false },
      { owner: true },
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

  async moderateDelete(id: number) {
    const toDelete = await this.giveawayRepo.findOne({ id }, { owner: true });
    if (!toDelete) throw new NotFoundException('Giveaway not found');

    await this.remove(toDelete.id);
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

  async findById(id: number) {
    const giveaway = await this.giveawayRepo.findOne(
      { id },
      { partners: true },
    );

    return giveaway;
  }

  async update(id: number, body: UpdateGiveawayDto) {
    const { title, description, postUrl } = body;
    const { participants, partnersIds } = body;
    const updateObj: Partial<Giveaway> = { title, description, postUrl };

    const relationsToUpdate: FindOptionsRelations<Giveaway> = {};
    relationsToUpdate.participants = !!participants;
    relationsToUpdate.partners = !!partnersIds;

    let updated: Giveaway;
    if (Object.values(updateObj).some((value) => value !== undefined)) {
      updated = await this.giveawayRepo.findOneAndUpdate(
        { id },
        updateObj,
        relationsToUpdate,
      );
    } else {
      updated = await this.giveawayRepo.findOne({ id }, relationsToUpdate);
    }

    if (relationsToUpdate.participants) {
      const participantsEntity = this.mapParticipantsToEntity(participants);
      updated.participants.push(...participantsEntity);
      updated.participantsCount += participantsEntity.length;
    }

    if (relationsToUpdate.partners) {
      const idsArray = partnersIds.trim().split(' ').map(Number);
      try {
        const partners = await this.usersService.findManyById(idsArray);
        updated.partners = partners;
      } catch (error) {
        throw new HttpException(
          'Error when getting partners. ' + error.message,
          500,
        );
      }
    }

    return this.giveawayRepo.save(updated);
  }

  async end(id: number) {
    return this.giveawayRepo.findOneAndUpdate({ id }, { ended: true });
  }

  async remove(id: number) {
    return this.giveawayRepo.findOneAndDelete({ id });
  }

  async getResult(id: number) {
    const giveaway = await this.giveawayRepo.findOne(
      { id },
      {
        participants: true,
        winner: true,
      },
    );

    const results = new GiveawayResultDto();
    results.participants = giveaway.participants.map((p) => p.nickname);
    results.winner = giveaway.winner?.nickname || '';

    return results;
  }

  async collectParticipants(
    participantsSourceDto: ParticipantsSourceDto,
    ownerId: number,
  ) {
    const id = participantsSourceDto.giveawayId;
    const giveaway = await this.giveawayRepo.findOne({ id }, { owner: true });

    if (giveaway.owner?.id !== ownerId) {
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
      new CollectParticipantsEvent(giveaway.id, participantsSourceDto.postUrl),
    );
  }

  async addParticipants(id: number, addParticipantsDto: AddParticipantsDto) {
    const giveaway = await this.giveawayRepo.findOne({ id });
    const participants = this.mapParticipantsToEntity(addParticipantsDto.data);
    giveaway.participants.push(...participants);
    giveaway.participantsCount += participants.length;
    return this.giveawayRepo.save(giveaway);
  }

  searchGiveaways(query: string) {
    return this.giveawayRepo.searchGiveaways(query);
  }

  async getUnmoderatedGiveaways(limit: number, lastItemId: number) {
    if (lastItemId !== undefined && lastItemId > 0) {
      const item = await this.giveawayRepo.findOne({ id: lastItemId });
      if (!item) {
        throw new NotFoundException('Last item id is invalid.');
      }
    }

    return this.giveawayRepo.getUnmoderatedByLastId(limit, lastItemId);
  }

  async getPartneredPaginatedGiveaways(
    partnerId: number,
    offset: number,
    limit: number,
  ) {
    return this.giveawayRepo.getPartneredGiveaways(partnerId, offset, limit);
  }

  async getOwnPaginatedGiveaways(
    userId: number,
    offset: number,
    limit: number,
  ) {
    return this.giveawayRepo.getOwnGiveaways(userId, offset, limit);
  }

  private mapParticipantsToEntity(participantsStr: string) {
    const participants = participantsStr.trim().split(' ');
    return participants.map((nickname) => new Participant({ nickname }));
  }
}
