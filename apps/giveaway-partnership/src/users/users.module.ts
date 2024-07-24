import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuthService } from '../auth/auth.service';
import { DatabaseModule } from '@app/common';
import { JwtService } from '@nestjs/jwt';
import { PasswordService } from '../auth/password.service';

@Module({
  imports: [DatabaseModule],
  controllers: [UsersController],
  providers: [UsersService, AuthService, PasswordService, JwtService],
  exports: [UsersService],
})
export class UsersModule {}
