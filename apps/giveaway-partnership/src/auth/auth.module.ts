import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { MailModule } from '../mail/mail.module';
import { AccessStrategy, RefreshStrategy } from './strategies';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '@app/common';
import { PasswordService } from './password.service';
import { ConfigModule } from '@app/common/config/config.module';

@Module({
  imports: [JwtModule.register({}), MailModule, DatabaseModule, ConfigModule],
  providers: [PasswordService, AuthService, AccessStrategy, RefreshStrategy],
  controllers: [AuthController],
  exports: [AuthService, PasswordService],
})
export class AuthModule {}
