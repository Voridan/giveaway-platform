import { Module } from '@nestjs/common';
import { GiveawaysController } from './giveaways.controller';
import { GiveawaysService } from './giveaways.service';
import { GiveawayTypeOrmRepository } from '../repository/giveaway.typeorm-repository';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { UsersModule } from '../users/users.module';
import { MailModule } from '../mail/mail.module';
import { DatabaseModule, Giveaway, Participant } from '@app/common';
import { ParticipantsTypeOrmRepository } from '../repository/participants.typeorm-repository';

@Module({
  imports: [
    UsersModule,
    MailModule,
    DatabaseModule.forFeature([Giveaway, Participant]),
    ClientsModule.register([
      {
        name: 'participants-microservice',
        transport: Transport.TCP,
      },
    ]),
  ],
  controllers: [GiveawaysController],
  providers: [
    GiveawaysService,
    GiveawayTypeOrmRepository,
    ParticipantsTypeOrmRepository,
  ],
})
export class GiveawaysModule {}
