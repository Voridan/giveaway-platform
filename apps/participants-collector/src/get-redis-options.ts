import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';

config();

const configService = new ConfigService();

export default function getRedisOptions() {
  return {
    host: configService.get('REDIS_HOST'),
    port: configService.get('REDIS_PORT'),
    username: 'default',
    password: configService.get('REDIS_PASSWORD'),
  };
}
