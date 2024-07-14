import { Test, TestingModule } from '@nestjs/testing';
import { GiveawaysController } from './giveaways.controller';

describe('GiveawaysController', () => {
  let controller: GiveawaysController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GiveawaysController],
    }).compile();

    controller = module.get<GiveawaysController>(GiveawaysController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
