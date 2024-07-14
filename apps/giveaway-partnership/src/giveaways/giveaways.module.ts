import { Module } from '@nestjs/common';
import { GiveawaysController } from './giveaways.controller';
import { GiveawaysService } from './giveaways.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GiveawayTypeOrmRepository } from '../repository/giveaway.typeorm-repository';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { UsersModule } from '../users/users.module';
import { MailModule } from '../mail/mail.module';
import { Giveaway, Participant } from '@app/common';

@Module({
  imports: [
    UsersModule,
    MailModule,
    TypeOrmModule.forFeature([Giveaway, Participant]),
    ClientsModule.register([
      {
        name: 'participants-microservice',
        transport: Transport.TCP,
      },
    ]),
  ],
  controllers: [GiveawaysController],
  providers: [GiveawaysService, GiveawayTypeOrmRepository],
})
export class GiveawaysModule {}
