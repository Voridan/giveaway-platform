import { Participant } from './participant.entity';
import { User } from './user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { AbstractEntity } from './abstract-entity';

@Entity()
@Index('IDX_OWNER_ID', ['ownerId'])
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

  @Column({ type: 'tsvector', select: false, nullable: true })
  document: string;

  @Column()
  ownerId: number;

  @Column({ nullable: true })
  winnerId: number;

  @ManyToOne(() => User, (user) => user.ownGiveaways)
  owner: User;

  @ManyToMany(() => User)
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
    cascade: ['insert'],
  })
  participants: Participant[];
}
