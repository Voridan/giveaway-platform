import { Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Giveaway, Participant, User } from './entities';
import { RowsCount } from './entities/rows-count.entity';
import {
  GiveawaySubscriber,
  ParticipantSubscriber,
  UserSubscriber,
} from './subscribers';
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return {
          type: 'postgres',
          database: config.get<string>('DB_NAME'),
          host: config.get<string>('DB_HOST'),
          port: config.get<number>('DB_PORT'),
          username: config.get<string>('DB_USER'),
          password: config.get<string>('DB_PASSWORD'),
          entities: [User, Giveaway, Participant, RowsCount],
          synchronize: true,
        };
      },
    }),
  ],
  providers: [UserSubscriber, GiveawaySubscriber, ParticipantSubscriber],
})
export class DatabaseModule {
  static forFeature(models: EntityClassOrSchema[]) {
    return TypeOrmModule.forFeature(models);
  }
}
