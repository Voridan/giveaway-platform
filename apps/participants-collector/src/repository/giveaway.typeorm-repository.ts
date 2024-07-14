import { GenericTypeOrmRepository, Giveaway } from '@app/common';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

export class GiveawayTypeOrmRepository extends GenericTypeOrmRepository<Giveaway> {
  protected readonly logger = new Logger(GiveawayTypeOrmRepository.name);

  constructor(
    @InjectRepository(Giveaway) giveawayRepo: Repository<Giveaway>,
    entiryManager: EntityManager,
  ) {
    super(giveawayRepo, entiryManager);
  }
}
