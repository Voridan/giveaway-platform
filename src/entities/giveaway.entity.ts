import { Participant } from './participant.entity';
import { User } from './user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Giveaway {
  @PrimaryGeneratedColumn()
  giveawayId: number;

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

  @ManyToOne(() => User, (user) => user.ownGiveaways)
  owner: User;

  @ManyToOne(() => Participant, { nullable: true })
  winner: Participant;

  @OneToMany(() => Participant, (participant) => participant.giveaway)
  participants: Participant[];
}
