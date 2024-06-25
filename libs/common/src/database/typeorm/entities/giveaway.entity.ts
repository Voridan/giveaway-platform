import { IGiveaway } from '@app/common/interface/giveaway.interface';
import { Participant } from './participant.entity';
import { User } from './user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { AbstractEntity } from './abstract.entity';

@Entity()
export class Giveaway extends AbstractEntity<Giveaway> implements IGiveaway {
  @Column()
  title: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column()
  price: number;

  @Column({ default: true })
  onModeration: boolean;

  @Column({ default: false })
  ended: boolean;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @Column()
  ownerId: number;

  @Column({ nullable: true })
  winnerId: number;

  @ManyToOne(() => User, (user) => user.ownGiveaways)
  owner: User;

  @ManyToOne(() => Participant, { nullable: true })
  winner: Participant;

  @OneToMany(() => Participant, (participant) => participant.giveaway)
  participants: Participant[];
}
