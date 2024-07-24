import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuthService } from '../auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { DatabaseModule, UserDocument, UserSchema } from '@app/common';
import { UserMongooseRepository } from '../repository/user.mongoose-repository';

@Module({
  imports: [
    DatabaseModule.forFeature([
      { name: UserDocument.name, schema: UserSchema },
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService, AuthService, JwtService, UserMongooseRepository],
  exports: [UsersService],
})
export class UsersModule {}
