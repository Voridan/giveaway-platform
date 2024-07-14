import { Participant } from './participant.entity';
import { User } from './user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { AbstractEntity } from './abstract.entity';

@Entity()
export class Giveaway extends AbstractEntity<Giveaway> {
  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ nullable: true })
  postUrl: string;

  @Column({ default: true })
  onModeration: boolean;

  @Column({ default: false })
  ended: boolean;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @Column({ default: 0 })
  participantsCount: number;

  @Column()
  ownerId: number;

  @Column({ nullable: true })
  winnerId: number;

  @Column({ type: 'tsvector', select: false, nullable: true })
  document: string;

  @ManyToOne(() => User, (user) => user.ownGiveaways)
  owner: User;

  @ManyToOne(() => Participant, { nullable: true })
  winner: Participant;

  @ManyToMany(() => User, { cascade: true })
  @JoinTable({
    name: 'giveaway_partners_user',
    joinColumn: {
      name: 'giveawayId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'userId',
      referencedColumnName: 'id',
    },
  })
  partners: User[];

  @OneToMany(() => Participant, (participant) => participant.giveaway, {
    cascade: true,
  })
  participants: Participant[];
}
