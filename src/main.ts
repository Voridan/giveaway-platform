import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ImATeapotException, ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';

const whitelist = ['http://localhost:5173'];

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: true });
  app.enableCors({
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    exposedHeaders: ['giveaways-total-count'],
    credentials: true,
    origin: function (origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (whitelist.includes(origin)) {
        callback(null, true);
      } else {
        callback(new ImATeapotException('Not allowed by CORS'), false);
      }
    },
  });
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  await app.listen(5000);
}
bootstrap();
