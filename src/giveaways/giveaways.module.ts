import { Module } from '@nestjs/common';
import { GiveawaysController } from './giveaways.controller';
import { GiveawaysService } from './giveaways.service';
import { Giveaway } from '@app/common/database/typeorm/entities/giveaway.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GiveawayTypeOrmRepository } from 'src/repository/typeorm/giveaway.typeorm-repository';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { GiveawayMongooseRepository } from 'src/repository/mongodb/giveaway.mongoose-repository';
import { MongooseModule } from '@nestjs/mongoose';
import { GiveawayDocument, GiveawaySchema, Participant } from '@app/common';
import { ParticipantsTypeOrmRepository } from 'src/repository/typeorm/participants.typeorm-repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([Giveaway, Participant]),
    MongooseModule.forFeature([
      { name: GiveawayDocument.name, schema: GiveawaySchema },
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
    GiveawayTypeOrmRepository,
    GiveawayMongooseRepository,
    ParticipantsTypeOrmRepository,
  ],
})
export class GiveawaysModule {}
