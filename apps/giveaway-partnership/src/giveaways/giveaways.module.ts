import { Module } from '@nestjs/common';
import { GiveawaysController } from './giveaways.controller';
import { GiveawaysService } from './giveaways.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { GiveawayMongooseRepository } from '../repository/giveaway.mongoose-repository';
import { UsersModule } from '../users/users.module';
import { MailModule } from '../mail/mail.module';
import {
  DatabaseModule,
  GiveawayDocument,
  GiveawaySchema,
  UserDocument,
  UserSchema,
  UserSubdocument,
  UserSubdocumentSchema,
} from '@app/common';
import { UserMongooseRepository } from '../repository/user.mongoose-repository';

@Module({
  imports: [
    UsersModule,
    MailModule,
    DatabaseModule.forFeature([
      { name: GiveawayDocument.name, schema: GiveawaySchema },
      { name: UserDocument.name, schema: UserSchema },
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
  providers: [
    GiveawaysService,
    GiveawayMongooseRepository,
    UserMongooseRepository,
  ],
})
export class GiveawaysModule {}
