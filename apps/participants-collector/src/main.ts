import { NestFactory } from '@nestjs/core';
import { ParticipantsCollectorModule } from './participants-collector.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

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
