import { Column, Entity, ManyToOne } from 'typeorm';
import { Giveaway } from './giveaway.entity';
import { AbstractEntity } from './abstract.entity';

@Entity()
export class Participant extends AbstractEntity<Participant> {
  @Column()
  nickname: string;

  @ManyToOne(() => Giveaway, (giveaway) => giveaway.participants, {
    onDelete: 'CASCADE',
  })
  giveaway: Giveaway;
}
