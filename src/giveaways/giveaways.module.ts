import { Module } from '@nestjs/common';
import { GiveawaysController } from './giveaways.controller';
import { GiveawaysService } from './giveaways.service';
import { Giveaway } from '@app/common/database/typeorm/entities/giveaway.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GiveawayTypeOrmRepository } from 'src/repository/giveaway.typeorm-repository';

@Module({
  imports: [TypeOrmModule.forFeature([Giveaway])],
  controllers: [GiveawaysController],
  providers: [GiveawaysService, GiveawayTypeOrmRepository],
})
export class GiveawaysModule {}
