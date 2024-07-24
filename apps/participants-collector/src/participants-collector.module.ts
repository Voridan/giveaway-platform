import { Module } from '@nestjs/common';
import { ParticipantsCollectorController } from './participants-collector.controller';
import { ParticipantsCollectorService } from './participants-collector.service';
import { ConfigService } from '@nestjs/config';
import { DatabaseModule, PrismaService } from '@app/common';

@Module({
  imports: [DatabaseModule],
  controllers: [ParticipantsCollectorController],
  providers: [ParticipantsCollectorService, ConfigService, PrismaService],
})
export class ParticipantsCollectorModule {}
