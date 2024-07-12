import { Module } from '@nestjs/common';
import { GiveawaysController } from './giveaways.controller';
import { GiveawaysService } from './giveaways.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { GiveawayMongooseRepository } from 'src/repository/giveaway.mongoose-repository';
import { UsersModule } from 'src/users/users.module';
import { MailModule } from 'src/mail/mail.module';
import {
  DatabaseModule,
  GiveawayDocument,
  GiveawaySchema,
  UserSubdocument,
  UserSubdocumentSchema,
} from '@app/common';

@Module({
  imports: [
    UsersModule,
    MailModule,
    DatabaseModule.forFeature([
      { name: GiveawayDocument.name, schema: GiveawaySchema },
      { name: UserSubdocument.name, schema: UserSubdocumentSchema },
    ]),
    ClientsModule.register([
      {
        name: 'participants-microservice',
        transport: Transport.TCP,
      },
    ]),
  ],
  controllers: [GiveawaysController],
  providers: [GiveawaysService, GiveawayMongooseRepository],
})
export class GiveawaysModule {}
