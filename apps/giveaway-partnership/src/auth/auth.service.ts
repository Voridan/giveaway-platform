import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { PasswordService } from './password.service';
import { LoginUserDto } from '../users/dto/login-user.dto';
import { randomBytes } from 'crypto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Tokens } from './types';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@app/common';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async signupLocal(createUser: CreateUserDto) {
    const hashedPassword = await this.passwordService.hash(createUser.password);
    createUser.password = hashedPassword;
    const newUser = await this.prismaService.user.create({ data: createUser });
    const tokens = await this.getTokens(
      newUser.id,
      newUser.isAdmin,
      newUser.email,
    );
    await this.updateRefreshTokenHash(newUser.id, tokens.refreshToken);
    return { user: newUser, tokens };
  }

  async loginLocal(dto: LoginUserDto) {
    const user = await this.prismaService.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new BadRequestException('Invalid email.');
    }

    const passwordMatch = await this.passwordService.compare(
      user.password,
      dto.password,
    );

    if (!passwordMatch) {
      throw new BadRequestException('Wrong password.');
    }

    const tokens = await this.getTokens(user.id, user.isAdmin, user.email);
    await this.updateRefreshTokenHash(user.id, tokens.refreshToken);
    return { user, tokens };
  }

  logout(userId: number) {
    return this.prismaService.user.update({
      where: { id: userId, jwtRefreshTokenHash: { not: null } },
      data: { jwtRefreshTokenHash: null },
    });
  }

  async refresh(userId: number, rt: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });
    if (!user || !user.jwtRefreshTokenHash) {
      throw new ForbiddenException('Wrong email.');
    }

    const rtMatches = await this.passwordService.compare(
      user.jwtRefreshTokenHash,
      rt,
    );

    if (!rtMatches) {
      throw new ForbiddenException('Wrong password.');
    }

    const tokens = await this.getTokens(user.id, user.isAdmin, user.email);
    await this.updateRefreshTokenHash(user.id, tokens.refreshToken);
    return { user, tokens };
  }

  async getTokens(
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

  async updateRefreshTokenHash(userId: number, rt: string) {
    const hash = await this.passwordService.hash(rt);
    await this.prismaService.user.update({
      where: {
        id: userId,
      },
      data: {
        jwtRefreshTokenHash: hash,
      },
    });
  }

  async generateResetPasswordTokenAndSave(email: string) {
    const user = await this.prismaService.user.findUnique({
      where: { email },
    });
    if (!user) {
      throw new BadRequestException('User with that email does not exists');
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
    await this.prismaService.user.update({
      where: { id: user.id },
      data: { ...user },
    });

    return secret;
  }

  async resetPassword(id: number, resetPasswordDto: ResetPasswordDto) {
    const user = await this.prismaService.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const isExpired = new Date(user.resetPasswordExpires) < new Date();
    if (isExpired) {
      throw new BadRequestException('Reset token expired');
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
      throw new BadRequestException('Secret token is invalid');
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

    return this.prismaService.user.update({ where: { id }, data: { ...user } });
  }
}
