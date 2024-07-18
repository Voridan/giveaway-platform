import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { User } from '@app/common/database/entities/user.entity';
import { MailModule } from '../mail/mail.module';

import { AccessStrategy, RefreshStrategy } from './strategies';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@app/common';
import { PasswordService } from './password.service';

@Module({
  imports: [
    JwtModule.register({}),
    UsersModule,
    MailModule,
    DatabaseModule.forFeature([User]),
    ConfigModule,
  ],
  providers: [PasswordService, AuthService, AccessStrategy, RefreshStrategy],
  controllers: [AuthController],
  exports: [AuthService, PasswordService],
})
export class AuthModule {}
