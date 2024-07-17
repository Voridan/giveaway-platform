import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import { Giveaway } from './giveaway.entity';
import { AbstractEntity } from './abstract.entity';

@Entity()
export class Participant extends AbstractEntity<Participant> {
  @Column()
  nickname: string;

  @PrimaryColumn()
  giveawayId: number;

  @ManyToOne(() => Giveaway, (giveaway) => giveaway.participants, {
    onDelete: 'CASCADE',
  })
  giveaway: Giveaway;
}
