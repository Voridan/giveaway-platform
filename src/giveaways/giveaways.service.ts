import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateGiveawayDto } from './dto/create-giveaway.dto';
import { User } from '@app/common/database/typeorm/entities/user.entity';
import { UpdateGiveawayDto } from './dto/update-giveaway.dto';
import { GiveawayResultDto } from './dto/giveaway-result.dto';
import { GiveawayTypeOrmRepository } from 'src/repository/typeorm/giveaway.typeorm-repository';
import { Giveaway, Participant } from '@app/common';
import { ClientProxy } from '@nestjs/microservices';
import { ParticipantsSourceDto } from './dto/participants-source.dto';
import { CollectCommentsEvent } from './events/collect-comments.event';
import { AddParticipantsDto } from './dto/add-participants.dto';
import { ParticipantsTypeOrmRepository } from 'src/repository/typeorm/participants.typeorm-repository';

@Injectable()
export class GiveawaysService {
  constructor(
    private readonly giveawayRepo: GiveawayTypeOrmRepository,
    private readonly participantsRepo: ParticipantsTypeOrmRepository,
    @Inject('participants-microservice')
    private readonly participantsClient: ClientProxy,
  ) {}

  async create(giveawayDto: CreateGiveawayDto, user: User) {
    const giveaway = new Giveaway(giveawayDto);
    giveaway.owner = user;
    return this.giveawayRepo.create(giveaway);
  }

  async moderate(id: number, onModeration: boolean) {
    return this.giveawayRepo.findOneAndUpdate({ id }, { onModeration });
  }

  findById(id: number) {
    return this.giveawayRepo.findOne({ id }, { owner: true, winner: true });
  }

  async update(id: number, body: UpdateGiveawayDto) {
    return this.giveawayRepo.findOneAndUpdate({ id }, body);
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
      new CollectCommentsEvent(giveaway, participantsSourceDto.postUrl),
    );
  }

  async addParticipants(id: number, addParticipantsDto: AddParticipantsDto) {
    const giveaway = await this.giveawayRepo.findOne({ id });
    const participants = addParticipantsDto.data.split(' ');
    const entities = participants.map(
      (nickname) => new Participant({ nickname, giveaway }),
    );

    this.participantsRepo.save(entities);
  }

  searchGiveaways(query: string) {
    return this.giveawayRepo.searchGiveaways(query);
  }

  async getPaginatediveaways(page: number, limit: number, lastItemId: number) {
    if (lastItemId !== undefined) {
      const item = await this.giveawayRepo.findOne({ id: lastItemId });
      if (!item) {
        throw new NotFoundException('Last item id is invalid.');
      }
    }

    const offset = (page - 1) * limit;
    return this.giveawayRepo.getPaginated(offset, limit, lastItemId);
  }
}
