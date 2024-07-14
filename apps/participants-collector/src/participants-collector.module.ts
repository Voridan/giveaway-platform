import { Module } from '@nestjs/common';
import { ParticipantsCollectorController } from './participants-collector.controller';
import { ParticipantsCollectorService } from './participants-collector.service';

@Module({
  imports: [],
  controllers: [ParticipantsCollectorController],
  providers: [ParticipantsCollectorService],
})
export class ParticipantsCollectorModule {}
