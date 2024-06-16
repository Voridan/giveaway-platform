import { IUser } from '@app/common/interface/user.interface';
import { Giveaway } from './giveaway.entity';
import {
  AfterInsert,
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
} from 'typeorm';
import { AbstractEntity } from './abstract.entity';

@Entity()
export class User extends AbstractEntity<User> implements IUser {
  @Column()
  userName: string;

  @Column()
  password: string;

  @Column()
  email: string;

  @Column({ default: false })
  isAdmin: boolean;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @Column({ nullable: true })
  resetPasswordToken?: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  resetPasswordExpires?: Date;

  @OneToMany(() => Giveaway, (giveaway) => giveaway.owner)
  ownGiveaways: Giveaway[];

  @ManyToMany(() => Giveaway)
  @JoinTable()
  giveaways: Giveaway[];

  @AfterInsert()
  logInsert() {
    console.log(`Inserted user with id: ${this.id}`);
  }

  validatePasswordReset(token: string): boolean {
    return (
      this.resetPasswordToken === token &&
      this.resetPasswordExpires &&
      this.resetPasswordExpires > new Date()
    );
  }
}
