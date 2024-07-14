import { Controller, Get } from '@nestjs/common';
import { ParticipantsCollectorService } from './participants-collector.service';

@Controller()
export class ParticipantsCollectorController {
  constructor(private readonly participantsCollectorService: ParticipantsCollectorService) {}

  @Get()
  getHello(): string {
    return this.participantsCollectorService.getHello();
  }
}
