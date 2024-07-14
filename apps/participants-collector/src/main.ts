import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ParticipantsCollectorModule } from './participants-collector.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    ParticipantsCollectorModule,
    {
      transport: Transport.TCP,
    },
  );
  await app.listen();
}
bootstrap();
