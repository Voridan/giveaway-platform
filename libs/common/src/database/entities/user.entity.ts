import { Giveaway } from './giveaway.entity';
import {
  AfterInsert,
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  OneToMany,
} from 'typeorm';
import { AbstractEntity } from './abstract-entity';

@Entity({ name: 'user' })
export class User extends AbstractEntity<User> {
  @Column({ unique: true })
  userName: string;

  @Column()
  password: string;

  @Column({ unique: true })
  email: string;

  @Column({ default: false })
  isAdmin: boolean;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @Column({ nullable: true })
  jwtRefreshTokenHash?: string;

  @Column({ nullable: true })
  resetPasswordToken?: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  resetPasswordExpires?: Date;

  @OneToMany(() => Giveaway, (giveaway) => giveaway.owner, {
    onDelete: 'CASCADE',
  })
  ownGiveaways: Giveaway[];

  @ManyToMany(() => Giveaway, (giveaway) => giveaway.partners)
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
