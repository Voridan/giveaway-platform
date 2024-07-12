import { NestFactory } from '@nestjs/core';
import { ParticipantsCollectorModule } from './participants-collector.module';

async function bootstrap() {
  const app = await NestFactory.create(ParticipantsCollectorModule);
  await app.listen(3000);
}
bootstrap();
