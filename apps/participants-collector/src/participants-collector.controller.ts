import { Controller } from '@nestjs/common';
import { ParticipantsCollectorService } from './participants-collector.service';
import { CollectParticipantsEvent } from '@app/common';
import { EventPattern } from '@nestjs/microservices';

@Controller()
export class ParticipantsCollectorController {
  constructor(
    private readonly participantsCollectorService: ParticipantsCollectorService,
  ) {}

  @EventPattern('collect-comments')
  async collectComments(data: CollectParticipantsEvent) {
    this.participantsCollectorService.collectInstagramParticipants(data);
  }
}
