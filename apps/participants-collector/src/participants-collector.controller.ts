import { Controller } from '@nestjs/common';
import { ParticipantsCollectorService } from './participants-collector.service';
import { EventPattern } from '@nestjs/microservices';
import { CollectParticipantsEvent } from '@app/common/events/collect-participants.event';

@Controller()
export class ParticipantsCollectorController {
  constructor(
    private readonly participantsCollectorService: ParticipantsCollectorService,
  ) {}

  @EventPattern('collect-comments')
  async collectComments(data: CollectParticipantsEvent) {
    this.participantsCollectorService.collectInstagramComments(data);
  }
}
