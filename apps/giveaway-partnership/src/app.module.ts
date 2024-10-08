import { MiddlewareConsumer, Module, ValidationPipe } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { GiveawaysModule } from './giveaways/giveaways.module';

import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { ConfigModule } from '@app/common/config/config.module';
import { DatabaseModule } from '@app/common';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { AccessGuard } from './guards';
import * as cookieParser from 'cookie-parser';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    UsersModule,
    GiveawaysModule,
    AuthModule,
    MailModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({ whitelist: true }),
    },
    {
      provide: APP_GUARD,
      useClass: AccessGuard,
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(cookieParser()).forRoutes('*');
  }
}
