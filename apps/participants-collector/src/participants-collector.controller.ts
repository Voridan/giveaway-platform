import { Controller } from '@nestjs/common';
import { ParticipantsCollectorService } from './participants-collector.service';
import { CollectParticipantsEvent } from '@app/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class ParticipantsCollectorController {
  constructor(
    private readonly participantsCollectorService: ParticipantsCollectorService,
  ) {}

  @MessagePattern('collect-comments')
  async collectComments(@Payload() data: CollectParticipantsEvent) {
    this.participantsCollectorService.collectInstagramParticipants(data);
  }
}
