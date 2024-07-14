import { Test, TestingModule } from '@nestjs/testing';
import { ParticipantsCollectorController } from './participants-collector.controller';
import { ParticipantsCollectorService } from './participants-collector.service';

describe('ParticipantsCollectorController', () => {
  let participantsCollectorController: ParticipantsCollectorController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ParticipantsCollectorController],
      providers: [ParticipantsCollectorService],
    }).compile();

    participantsCollectorController = app.get<ParticipantsCollectorController>(ParticipantsCollectorController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(participantsCollectorController.getHello()).toBe('Hello World!');
    });
  });
});
