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

  searchGiveaways(query: string) {
    const queryBuilder = this.entityRepository
      .createQueryBuilder('giveaway')
      .innerJoinAndSelect('giveaway.owner', 'user')
      .where('giveaway.title ILIKE :title', { title: `%${query}%` })
      .orWhere('user.userName ILIKE :username', { username: `%${query}%` });

    const id = parseInt(query);
    if (!isNaN(id)) {
      queryBuilder.orWhere('giveaway.id = :id', { id });
    }

    return queryBuilder.getMany();
  }

  getPaginated(offset: number, limit: number, lastItemId: number) {
    const qb = this.entityRepository.createQueryBuilder('giveaway');
    if (lastItemId !== undefined) {
      qb.where('giveaway.id > :lastItemId', { lastItemId });
    } else {
      qb.skip(offset);
    }

    return qb.take(limit).orderBy('giveaway.id').getManyAndCount();
  }
}
