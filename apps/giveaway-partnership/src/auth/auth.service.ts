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
import { UserMongooseRepository } from '../repository/user.mongoose-repository';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersRepo: UserMongooseRepository,
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
      newUser._id.toString(),
      newUser.isAdmin,
      newUser.email,
    );
    await this.updateRefreshTokenHash(
      newUser._id.toString(),
      tokens.refreshToken,
    );

    return { newUser, tokens };
  }

  async loginLocal(dto: LoginUserDto) {
    const user = await this.usersService.findByEmail(dto.email);

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

    const tokens = await this.getTokens(
      user._id.toString(),
      user.isAdmin,
      user.email,
    );
    await this.updateRefreshTokenHash(user._id.toString(), tokens.refreshToken);
    return { user, tokens };
  }

  logout(userId: string) {
    return this.usersRepo.findOneAndUpdate(
      { _id: userId, jwtRefreshTokenHash: { $ne: null, $exists: true } },
      { jwtRefreshTokenHash: null },
    );
  }

  async refresh(userId: string, rt: string) {
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

    const tokens = await this.getTokens(
      user._id.toString(),
      user.isAdmin,
      user.email,
    );
    await this.updateRefreshTokenHash(user._id.toString(), tokens.refreshToken);
    return { user, tokens };
  }

  private async getTokens(
    userId: string,
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

  private async updateRefreshTokenHash(userId: string, rt: string) {
    const hash = await this.passwordService.hash(rt);
    await this.usersService.update(userId, {
      jwtRefreshTokenHash: hash,
    });
  }

  async generateResetPasswordTokenAndSave(email: string) {
    const user = await this.usersRepo.findOne({ email });
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
    await this.usersService.update(user._id.toString(), user);

    return secret;
  }

  async resetPassword(id: string, resetPasswordDto: ResetPasswordDto) {
    const user = await this.usersRepo.findOne({ id });

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

    return this.usersRepo.updateOne({ _id: user._id }, user);
  }
}
