import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from 'src/users/users.module';
import { AuthController } from './auth.controller';
import { User } from '@app/common/database/typeorm/entities/user.entity';
import { MailModule } from 'src/mail/mail.module';
import { TypeormModule } from '@app/common';
import { UserTypeOrmRepository } from 'src/repository/typeorm/user.typeorm-repository';

@Module({
  imports: [UsersModule, MailModule, TypeormModule.forFeature([User])],
  providers: [AuthService, UserTypeOrmRepository],
  controllers: [AuthController],
})
export class AuthModule {}
