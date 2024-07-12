import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { MailModule } from '../mail/mail.module';
import { AccessStrategy, RefreshStrategy } from './strategies';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule, UserDocument, UserSchema } from '@app/common';
import { UserMongooseRepository } from '../repository/user.mongoose-repository';

@Module({
  imports: [
    JwtModule.register({}),
    DatabaseModule.forFeature([
      { name: UserDocument.name, schema: UserSchema },
    ]),
    UsersModule,
    MailModule,
    ConfigModule,
  ],
  providers: [
    AuthService,
    AccessStrategy,
    RefreshStrategy,
    UserMongooseRepository,
  ],
  controllers: [AuthController],
})
export class AuthModule {}
