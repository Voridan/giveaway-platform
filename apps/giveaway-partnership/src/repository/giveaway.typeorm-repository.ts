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
      .where('giveaway.document @@ plainto_tsquery(:query)', { query })
      .orWhere('user.userName ILIKE :username', { username: `%${query}%` });

    const id = parseInt(query);
    if (!isNaN(id)) {
      queryBuilder.orWhere('giveaway.id = :id', { id });
    }

    return queryBuilder.getMany();
  }

  getUnmoderatedByLastId(limit: number, lastItemId: number) {
    const qb = this.entityRepository.createQueryBuilder('giveaway');
    if (lastItemId > 0) qb.where('giveaway.id > :lastItemId', { lastItemId });
    qb.andWhere('giveaway.onModeration = true');

    return qb.take(limit).orderBy('giveaway.id').getManyAndCount();
  }

  getPartneredGiveaways(
    partnerId: number,
    offset: number,
    limit: number,
    lastItemId: number,
    forward: boolean = true,
  ) {
    const qb = this.entityRepository
      .createQueryBuilder('giveaway')
      .innerJoinAndSelect(
        'giveaway_partners_user',
        'gpu',
        'gpu.userId = :partnerId',
        { partnerId },
      )
      .where('gpu.giveawayId = giveaway.id');

    if (lastItemId) {
      if (forward) {
        qb.andWhere('giveaway.id > :lastItemId', { lastItemId });
      } else {
        qb.andWhere('giveaway.id < :lastItemId', { lastItemId });
      }
    }
    qb.orderBy('giveaway.id', forward ? 'ASC' : 'DESC');
    qb.skip(offset);
    qb.take(limit);
    return qb.getManyAndCount();
  }

  getOwnGiveaways(
    ownerId: number,
    offset: number,
    limit: number,
    lastItemId: number,
    forward: boolean = true,
  ) {
    const qb = this.entityRepository.createQueryBuilder('giveaway');
    qb.where('giveaway.ownerId = :ownerId', { ownerId });
    if (lastItemId) {
      if (forward) {
        qb.andWhere('giveaway.id > :lastItemId', { lastItemId });
      } else {
        qb.andWhere('giveaway.id < :lastItemId', { lastItemId });
      }
    }
    qb.orderBy('giveaway.id', forward ? 'ASC' : 'DESC');
    qb.skip(offset);
    qb.take(limit);
    return qb.getManyAndCount();
  }
}
