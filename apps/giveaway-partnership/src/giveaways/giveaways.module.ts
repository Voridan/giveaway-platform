import { Module } from '@nestjs/common';
import { GiveawaysController } from './giveaways.controller';
import { GiveawaysService } from './giveaways.service';
import { GiveawayTypeOrmRepository } from '../repository/giveaway.typeorm-repository';
import { UsersModule } from '../users/users.module';
import { MailModule } from '../mail/mail.module';
import { DatabaseModule, Giveaway, Participant } from '@app/common';
import { ParticipantsTypeOrmRepository } from '../repository/participants.typeorm-repository';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    UsersModule,
    MailModule,
    DatabaseModule.forFeature([Giveaway, Participant]),
    ClientsModule.registerAsync({
      clients: [
        {
          name: 'PARTICIPANT_COLLECTOR',
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            transport: Transport.REDIS,
            options: {
              host: configService.get('REDIS_HOST'),
              port: configService.get('REDIS_PORT'),
              username: 'default',
              password: configService.get('REDIS_PASSWORD'),
            },
          }),
        },
      ],
    }),
  ],
  controllers: [GiveawaysController],
  providers: [
    GiveawaysService,
    GiveawayTypeOrmRepository,
    ParticipantsTypeOrmRepository,
  ],
})
export class GiveawaysModule {}
