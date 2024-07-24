import { Module } from '@nestjs/common';
import { GiveawaysController } from './giveaways.controller';
import { GiveawaysService } from './giveaways.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { UsersModule } from '../users/users.module';
import { MailModule } from '../mail/mail.module';
import { DatabaseModule } from '@app/common';

@Module({
  imports: [
    UsersModule,
    MailModule,
    DatabaseModule,
    ClientsModule.register([
      {
        name: 'participants-microservice',
        transport: Transport.TCP,
      },
    ]),
  ],
  controllers: [GiveawaysController],
  providers: [GiveawaysService],
})
export class GiveawaysModule {}
