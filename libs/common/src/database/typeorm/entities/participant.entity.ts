import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Giveaway } from './giveaway.entity';

@Entity()
export class Participant {
  @PrimaryGeneratedColumn()
  participantId: number;

  @Column()
  nickname: string;

  @ManyToOne(() => Giveaway, (giveaway) => giveaway.participants)
  giveaway: Giveaway;
}
