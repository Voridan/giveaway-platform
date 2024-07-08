import { ConfigModule } from '@app/common/config/config.module';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule as NestTypeormModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Giveaway } from './entities/giveaway.entity';
import { Participant } from './entities/participant.entity';
import { RowsCount } from './entities/rows-count.entity';
import { UserSubscriber } from './subscribers/user.subscriber';
import { GiveawaySubscriber } from './subscribers/giveaway.subscriber';
import { ParticipantSubscriber } from './subscribers/participants.subscriber';

@Module({
  imports: [
    NestTypeormModule.forRootAsync({
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
export class TypeormModule extends NestTypeormModule {}
