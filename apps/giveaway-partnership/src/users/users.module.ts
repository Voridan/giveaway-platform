import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuthService } from '../auth/auth.service';
import { PasswordService } from './pasword.service';
import { DatabaseModule, User } from '@app/common';
import { UserTypeOrmRepository } from '../repository/user.typeorm-repository';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [DatabaseModule.forFeature([User])],
  controllers: [UsersController],
  providers: [
    UsersService,
    PasswordService,
    AuthService,
    UserTypeOrmRepository,
    JwtService,
  ],
  exports: [UsersService, PasswordService],
})
export class UsersModule {}
