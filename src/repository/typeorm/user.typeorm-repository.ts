import { GenericTypeOrmRepository, User } from '@app/common';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

export class UserTypeOrmRepository extends GenericTypeOrmRepository<User> {
  protected readonly logger = new Logger(UserTypeOrmRepository.name);

  constructor(
    @InjectRepository(User) userRepo: Repository<User>,
    entiryManager: EntityManager,
  ) {
    super(userRepo, entiryManager);
  }
}
