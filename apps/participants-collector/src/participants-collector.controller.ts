import { Controller } from '@nestjs/common';
import { ParticipantsCollectorService } from './participants-collector.service';
import { EventPattern } from '@nestjs/microservices';
import { CollectCommentsEvent } from '@app/common/events/collect-comments.event';

@Controller()
export class ParticipantsCollectorController {
  constructor(
    private readonly participantsCollectorService: ParticipantsCollectorService,
  ) {}

  @EventPattern('collect-comments')
  async collectComments(data: CollectCommentsEvent) {
    this.participantsCollectorService.collectInstagramComments(data);
  }
}
