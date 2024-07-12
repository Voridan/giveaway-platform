import { Injectable } from '@nestjs/common';

@Injectable()
export class ParticipantsCollectorService {
  getHello(): string {
    return 'Hello World!';
  }
}
