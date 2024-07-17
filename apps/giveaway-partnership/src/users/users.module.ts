import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuthService } from '../auth/auth.service';
import { DatabaseModule, User } from '@app/common';
import { UserTypeOrmRepository } from '../repository/user.typeorm-repository';
import { JwtService } from '@nestjs/jwt';
import { PasswordService } from '../auth/pasword.service';

@Module({
  imports: [DatabaseModule.forFeature([User])],
  controllers: [UsersController],
  providers: [
    UsersService,
    AuthService,
    PasswordService,
    UserTypeOrmRepository,
    JwtService,
  ],
  exports: [UsersService],
})
export class UsersModule {}
