import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ParticipantsCollectorModule } from './participants-collector.module';
import getRedisOptions from './get-redis-options';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    ParticipantsCollectorModule,
    {
      transport: Transport.REDIS,
      options: getRedisOptions(),
    },
  );
  await app.listen();
}
bootstrap();
