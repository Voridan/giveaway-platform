import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { PasswordService } from '../users/pasword.service';
import { LoginUserDto } from '../users/dto/login-user.dto';
import { randomBytes } from 'crypto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UserTypeOrmRepository } from 'src/repository/typeorm/user.typeorm-repository';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly passwordService: PasswordService,
    private readonly usersRepo: UserTypeOrmRepository,
  ) {}

  async signup(createUser: CreateUserDto) {
    const user = await this.usersService.findByEmail(createUser.email);
    if (user !== null) {
      throw new BadRequestException('Email is taken.');
    }

    const hashedPassword = await this.passwordService.hash(createUser.password);
    createUser.password = hashedPassword;

    return this.usersService.create(createUser);
  }

  async login(data: LoginUserDto) {
    const user = await this.usersService.findByEmail(data.email);
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const passwordMatch = await this.passwordService.compare(
      user.password,
      data.password,
    );

    if (!passwordMatch) {
      throw new BadRequestException('Invalid password');
    }

    // const tokenPayload: TokenPayload = {
    //   userId: user.id,
    //   admin: user.isAdmin,
    // };

    // const expires = new Date();
    // expires.setSeconds(
    //   expires.getSeconds() + this.configService.get<number>('JWT_EXPIRATION'),
    // );

    // const token = this.jwtService.sign(tokenPayload);

    // res.cookie('Authentication', token, {
    //   httpOnly: true,
    //   expires,
    // });

    return user;
  }

  async generateResetPasswordTokenAndSave(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User with that email does not exists');
    }

    if (
      user.resetPasswordToken &&
      new Date(user.resetPasswordExpires) > new Date()
    ) {
      return user.resetPasswordToken;
    }

    const secret = randomBytes(20).toString('hex');
    const secretHash = await this.passwordService.hash(secret);
    user.resetPasswordToken = secretHash;

    const FIVE_MINS = 5 * 60 * 1000;

    user.resetPasswordExpires = new Date(Date.now() + FIVE_MINS);
    await this.usersService.update(user.id, user);

    return secret;
  }

  async resetPassword(id: number, resetPasswordDto: ResetPasswordDto) {
    const user = await this.usersRepo.findOne({ id });

    if (!user) {
      throw new NotFoundException('user not found');
    }

    const isExpired = new Date(user.resetPasswordExpires) < new Date();
    if (isExpired) {
      throw new BadRequestException('reset token expired');
    }

    const { newPassword, secret } = resetPasswordDto;
    const isSecretValid = await this.passwordService.compare(
      user.resetPasswordToken,
      secret,
    );

    if (!isSecretValid) {
      throw new BadRequestException('secret token is invalid');
    }

    const newPasswordHash = await this.passwordService.hash(newPassword);

    user.password = newPasswordHash;
    user.resetPasswordExpires = null;
    user.resetPasswordToken = null;

    return this.usersRepo.save([user]);
  }
}
