import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { PasswordService } from './pasword.service';
import { LoginUserDto } from '../users/dto/login-user.dto';
import { randomBytes } from 'crypto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Tokens } from './types';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { IsNull, Not } from 'typeorm';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async signupLocal(createUser: CreateUserDto) {
    const user = await this.usersService.findByEmail(createUser.email);
    if (user !== null) {
      throw new BadRequestException('Email is taken.');
    }

    const hashedPassword = await this.passwordService.hash(createUser.password);
    createUser.password = hashedPassword;
    const newUser = await this.usersService.create(createUser);
    const tokens = await this.getTokens(
      newUser.id,
      newUser.isAdmin,
      newUser.email,
    );
    await this.updateRefreshTokenHash(newUser.id, tokens.refreshToken);
    return { user, tokens };
  }

  async loginLocal(dto: LoginUserDto) {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      throw new ForbiddenException('Invalid email.');
    }

    const passwordMatch = await this.passwordService.compare(
      user.password,
      dto.password,
    );

    if (!passwordMatch) {
      throw new ForbiddenException('Access denied.');
    }

    const tokens = await this.getTokens(user.id, user.isAdmin, user.email);
    await this.updateRefreshTokenHash(user.id, tokens.refreshToken);
    return { user, tokens };
  }

  logout(userId: number) {
    return this.usersService.update(
      { id: userId, jwtRefreshTokenHash: Not(IsNull()) },
      { jwtRefreshTokenHash: null },
    );
  }

  async refresh(userId: number, rt: string) {
    const user = await this.usersService.findById(userId);
    if (!user || !user.jwtRefreshTokenHash) {
      throw new ForbiddenException('Access denied.');
    }

    const rtMatches = this.passwordService.compare(
      user.jwtRefreshTokenHash,
      rt,
    );

    if (!rtMatches) {
      throw new ForbiddenException('Access denied.');
    }

    const tokens = await this.getTokens(user.id, user.isAdmin, user.email);
    await this.updateRefreshTokenHash(user.id, tokens.refreshToken);
    return { user, tokens };
  }

  private async getTokens(
    userId: number,
    admin: boolean,
    email: string,
  ): Promise<Tokens> {
    const FIFTEEN_MINS = 60 * 15;
    const ONE_WEEK = 60 * 60 * 24 * 7;
    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, email, admin },
        {
          secret: this.configService.get<string>('JWT_SECRET'),
          expiresIn: FIFTEEN_MINS,
        },
      ),
      this.jwtService.signAsync(
        { sub: userId, email, admin },
        {
          secret: this.configService.get<string>('JWT_REFRESH'),
          expiresIn: ONE_WEEK,
        },
      ),
    ]);

    return { accessToken: at, refreshToken: rt };
  }

  private async updateRefreshTokenHash(userId: number, rt: string) {
    const hash = await this.passwordService.hash(rt);
    await this.usersService.update(
      { id: userId },
      {
        jwtRefreshTokenHash: hash,
      },
    );
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
    await this.usersService.update({ id: user.id }, user);

    return secret;
  }

  async resetPassword(id: number, resetPasswordDto: ResetPasswordDto) {
    const user = await this.usersService.findById(id);

    if (!user) {
      throw new NotFoundException('user not found');
    }

    const isExpired = new Date(user.resetPasswordExpires) < new Date();
    if (isExpired) {
      throw new BadRequestException('reset token expired');
    }

    const { newPassword, oldPassword, secret } = resetPasswordDto;

    const isSecretValid = await this.passwordService.compare(
      user.resetPasswordToken,
      secret,
    );

    const passwordMatch = await this.passwordService.compare(
      user.password,
      oldPassword,
    );

    if (!isSecretValid) {
      throw new BadRequestException('secret token is invalid');
    }

    if (!passwordMatch) {
      throw new BadRequestException('Wrong old password');
    }

    const newPasswordHash = await this.passwordService.hash(newPassword);

    user.password = newPasswordHash;
    user.resetPasswordExpires = null;
    user.resetPasswordToken = null;
    const tokens = await this.getTokens(user.id, user.isAdmin, user.email);
    await this.updateRefreshTokenHash(user.id, tokens.refreshToken);
    return this.usersService.update({ id }, user);
  }
}
