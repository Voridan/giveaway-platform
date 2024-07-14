import { GenericTypeOrmRepository, Participant } from '@app/common';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

export class ParticipantsTypeOrmRepository extends GenericTypeOrmRepository<Participant> {
  protected readonly logger = new Logger(ParticipantsTypeOrmRepository.name);

  constructor(
    @InjectRepository(Participant) paricipantsRepo: Repository<Participant>,
    entityManager: EntityManager,
  ) {
    super(paricipantsRepo, entityManager);
  }
}
