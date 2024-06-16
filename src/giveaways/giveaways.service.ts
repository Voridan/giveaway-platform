import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateGiveawayDto } from './dto/create-giveaway.dto';
import { User } from '@app/common/database/typeorm/entities/user.entity';
import { UpdateGiveawayDto } from './dto/update-giveaway.dto';
import { GiveawayResultDto } from './dto/giveaway-result.dto';
import { GiveawayTypeOrmRepository } from 'src/repository/giveaway.typeorm-repository';
import { Giveaway } from '@app/common';

@Injectable()
export class GiveawaysService {
  constructor(private readonly giveawayRepo: GiveawayTypeOrmRepository) {}

  async create(giveawayDto: CreateGiveawayDto, user: User) {
    const giveaway = new Giveaway(giveawayDto);
    giveaway.owner = user;
    return this.giveawayRepo.create(giveaway);
  }

  async moderate(id: number, onModeration: boolean) {
    return this.giveawayRepo.findOneAndUpdate({ id }, { onModeration });
  }

  findById(id: number) {
    return this.giveawayRepo.findOne({ id });
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
}
