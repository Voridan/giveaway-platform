import { MiddlewareConsumer, Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuthService } from '../auth/auth.service';
import { PasswordService } from './pasword.service';
import { CurrentUserMiddleware } from '../middlewares/current-user.middleware';
import { TypeormModule, User } from '@app/common';
import { UserTypeOrmRepository } from 'src/repository/typeorm/user.typeorm-repository';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [TypeormModule.forFeature([User])],
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
export class UsersModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CurrentUserMiddleware).forRoutes('*');
  }
}
