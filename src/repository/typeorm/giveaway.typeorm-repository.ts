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

  getUnmoderatedByLastId(
    limit: number,
    lastItemId: number,
    relations: string[],
  ) {
    const qb = this.entityRepository.createQueryBuilder('giveaway');
    if (lastItemId > 0) qb.where('giveaway.id > :lastItemId', { lastItemId });
    qb.andWhere('giveaway.onModeration = true');
    relations.forEach((relation) =>
      qb.leftJoinAndSelect(`giveaway.${relation}`, relation),
    );

    return Promise.all([
      qb.take(limit).orderBy('giveaway.id').getMany(),
      this.entityRepository.count({ where: { onModeration: true } }),
    ]);
  }

  getPartneredGiveaways(
    partnerId: number,
    offset: number,
    limit: number,
    lastItemId: number,
    relations: string[],
  ) {
    const qb = this.entityRepository
      .createQueryBuilder('giveaway')
      .innerJoin(
        'giveaway_partners_user',
        'gpu',
        'gpu.giveawayId = giveaway.id',
      )
      .where('gpu.userId = :userId', { userId: partnerId });

    if (lastItemId !== undefined) {
      qb.andWhere('gpu.giveawayId > :lastItemId', { lastItemId });
    } else {
      qb.skip(offset);
    }

    relations.forEach((relation) =>
      qb.leftJoinAndSelect(`giveaway.${relation}`, relation),
    );

    return qb.take(limit).orderBy('giveaway.id').getManyAndCount();
  }

  getOwnGiveaways(
    ownerId: number,
    offset: number,
    limit: number,
    next: boolean,
    lastItemId: number,
    relations: string[],
  ) {
    const qb = this.entityRepository.createQueryBuilder('giveaway');
    qb.where('giveaway.ownerId = :ownerId', { ownerId });
    qb.skip(offset);
    if (lastItemId !== undefined) {
      next
        ? qb.andWhere('giveaway.id > :lastItemId', { lastItemId })
        : qb.andWhere('giveaway.id < :lastItemId', { lastItemId });
    }

    relations.forEach((relation) =>
      qb.leftJoinAndSelect(`giveaway.${relation}`, relation),
    );

    return Promise.all([
      qb.take(limit).orderBy('giveaway.id').getMany(),
      this.entityRepository.count({ where: { ownerId } }),
    ]);
  }
}
