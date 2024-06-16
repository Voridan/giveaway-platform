import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Giveaway } from 'src/entities/giveaway.entity';
import { Repository } from 'typeorm';
import { CreateGiveawayDto } from './dto/create-giveaway.dto';
import { User } from 'src/entities/user.entity';
import { UpdateGiveawayDto } from './dto/update-giveaway.dto';
import { Participant } from 'src/entities/participant.entity';
import { GiveawayResultDto } from './dto/giveaway-result.dto';

@Injectable()
export class GiveawaysService {
  constructor(
    @InjectRepository(Giveaway)
    private readonly giveawayRepo: Repository<Giveaway>,
    @InjectRepository(Participant)
    private readonly participantsRepo: Repository<Participant>,
  ) {}

  async create(giveawayDto: CreateGiveawayDto, user: User) {
    const giveaway = this.giveawayRepo.create(giveawayDto);
    giveaway.owner = user;
    return this.giveawayRepo.save(giveaway);
  }

  async moderate(id: number, onModeration: boolean) {
    const giveaway = await this.giveawayRepo.findOne({
      where: { giveawayId: id },
    });
    if (!giveaway) {
      throw new NotFoundException('Giveaway not found');
    }

    giveaway.onModeration = onModeration;
    return this.giveawayRepo.save(giveaway);
  }

  findById(id: number) {
    return this.giveawayRepo.findOne({ where: { giveawayId: id } });
  }

  async update(id: number, body: UpdateGiveawayDto) {
    const giveaway = await this.findById(id);
    if (!giveaway) {
      throw new NotFoundException('User not found.');
    }

    Object.assign(giveaway, body);
    return this.giveawayRepo.save(giveaway);
  }

  async remove(id: number) {
    const giveaway = await this.findById(id);
    if (!giveaway) {
      throw new NotFoundException('User not found.');
    }

    return this.giveawayRepo.remove(giveaway);
  }

  async getResult(id: number) {
    const giveaway = await this.giveawayRepo.findOne({
      where: { giveawayId: id },
      relations: ['participants', 'winner'],
    });

    if (!giveaway) {
      throw new NotFoundException('User not found.');
    }

    const results = new GiveawayResultDto();
    results.participants = giveaway.participants.map((p) => p.nickname);
    results.winner = giveaway.winner?.nickname || '';

    return results;
  }
}
