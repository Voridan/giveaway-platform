import { Test, TestingModule } from '@nestjs/testing';
import { GiveawaysService } from './giveaways.service';

describe('GiveawaysService', () => {
  let service: GiveawaysService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GiveawaysService],
    }).compile();

    service = module.get<GiveawaysService>(GiveawaysService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
