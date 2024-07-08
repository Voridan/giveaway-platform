import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from 'src/users/users.module';
import { AuthController } from './auth.controller';
import { User } from '@app/common/database/typeorm/entities/user.entity';
import { MailModule } from 'src/mail/mail.module';
import { TypeormModule } from '@app/common';
import { UserTypeOrmRepository } from 'src/repository/typeorm/user.typeorm-repository';
import { AccessStrategy, RefreshStrategy } from './strategies';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    JwtModule.register({}),
    UsersModule,
    MailModule,
    TypeormModule.forFeature([User]),
    ConfigModule,
  ],
  providers: [
    AuthService,
    UserTypeOrmRepository,
    AccessStrategy,
    RefreshStrategy,
  ],
  controllers: [AuthController],
})
export class AuthModule {}
