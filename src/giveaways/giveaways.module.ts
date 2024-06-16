import { Module } from '@nestjs/common';
import { GiveawaysController } from './giveaways.controller';
import { GiveawaysService } from './giveaways.service';
import { Giveaway } from '../entities/giveaway.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Participant } from 'src/entities/participant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Giveaway, Participant])],
  controllers: [GiveawaysController],
  providers: [GiveawaysService],
})
export class GiveawaysModule {}
