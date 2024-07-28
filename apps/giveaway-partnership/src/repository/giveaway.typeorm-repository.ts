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
    forward: boolean,
  ) {
    return this.entityManager.transaction(
      async (transactionalEntityManager) => {
        const qbGiveaways = transactionalEntityManager.createQueryBuilder(
          Giveaway,
          'giveaway',
        );
        const total = await qbGiveaways
          .innerJoinAndSelect(
            'giveaway_partners_user',
            'gpu',
            'gpu.userId = :partnerId',
            { partnerId },
          )
          .where('gpu.giveawayId = giveaway.id')
          .getCount();
        if (lastItemId) {
          if (forward) {
            qbGiveaways.andWhere('giveaway.id > :lastItemId', { lastItemId });
          } else {
            qbGiveaways.andWhere('giveaway.id < :lastItemId', { lastItemId });
          }
        }
        const pageGiveaways = await qbGiveaways
          .orderBy('giveaway.id', forward ? 'ASC' : 'DESC')
          .skip(offset)
          .take(limit)
          .getMany();

        !forward && pageGiveaways.sort((g1, g2) => g1.id - g2.id);
        return [pageGiveaways, total] as const;
      },
    );
  }

  async getOwnGiveaways(
    ownerId: number,
    offset: number,
    limit: number,
    lastItemId: number,
    forward: boolean,
  ) {
    return this.entityManager.transaction(
      async (transactionalEntityManager) => {
        const qbGiveaways = transactionalEntityManager.createQueryBuilder(
          Giveaway,
          'giveaway',
        );

        const total = await qbGiveaways
          .where('giveaway.ownerId = :ownerId', { ownerId })
          .getCount();

        if (lastItemId) {
          if (forward) {
            qbGiveaways.andWhere('giveaway.id > :lastItemId', { lastItemId });
          } else {
            qbGiveaways.andWhere('giveaway.id < :lastItemId', { lastItemId });
          }
        }
        const pageGiveaways = await qbGiveaways
          .orderBy('giveaway.id', forward ? 'ASC' : 'DESC')
          .skip(offset)
          .take(limit)
          .getMany();

        !forward && pageGiveaways.sort((g1, g2) => g1.id - g2.id);
        return [pageGiveaways, total] as const;
      },
    );
  }
}
