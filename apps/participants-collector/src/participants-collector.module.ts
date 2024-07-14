import { Module } from '@nestjs/common';
import { ParticipantsCollectorController } from './participants-collector.controller';
import { ParticipantsCollectorService } from './participants-collector.service';
import { ConfigService } from '@nestjs/config';
import { GiveawayTypeOrmRepository } from './repository/giveaway.typeorm-repository';
import { DatabaseModule, Giveaway } from '@app/common';

@Module({
  imports: [DatabaseModule, DatabaseModule.forFeature([Giveaway])],
  controllers: [ParticipantsCollectorController],
  providers: [
    ParticipantsCollectorService,
    ConfigService,
    GiveawayTypeOrmRepository,
  ],
})
export class ParticipantsCollectorModule {}
