import {
  Body,
  Controller,
  Param,
  Post,
  Query,
  Session,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { LoginUserDto } from 'src/users/dto/login-user.dto';
import { AuthService } from './auth.service';
import { UserDto } from 'src/users/dto/user.dto';
import { Serialize } from 'src/interceptors/serialize.interceptor';
import { AuthGuard } from 'src/guards/auth.guard';
import { CurrentUser } from 'src/users/decorators/current-user.decorator';
import { User } from 'src/entities/user.entity';
import { MailService } from 'src/mail/mail.service';
import { getResetPasswordEmailHtml } from './util/get-reset-password-email';
import { Email } from 'src/mail/types/email';
import e from 'express';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
    private readonly mailService: MailService,
  ) {}

  @Post('/signout')
  async signOut(@Session() session: any) {
    session.userId = null;
  }

  @Post('/signup')
  @Serialize(UserDto)
  async createUser(
    @Body() body: CreateUserDto,
    @Query('admin') adminSecret: string,
    @Session() session: any,
  ) {
    if (adminSecret === this.config.get<string>('ADMIN_ENDPOINT'))
      body.isAdmin = true;

    const user = await this.authService.signup(body);
    session.userId = user.userId;
    return user;
  }

  @Post('/login')
  @Serialize(UserDto)
  async loginUser(@Body() body: LoginUserDto, @Session() session: any) {
    const user = await this.authService.login(body);
    session.userId = user.userId;
    return user;
  }

  @Post('/forgot-password')
  @UseGuards(AuthGuard)
  async forgotPassword(@CurrentUser() user: User) {
    const secret = this.authService.generateResetPasswordTokenAndSave(
      user.email,
    );

    const frontendUrl = this.config.get<string>('FRONTEND_URL');
    const resetUrl = `${frontendUrl}/reset-password?secret=${secret}`;

    const emailHtml = getResetPasswordEmailHtml(user.userName, resetUrl);
    const email: Email = {
      from: this.config.get<string>('APP_MAIL'),
      to: user.email,
      subject: 'Password reset',
      html: emailHtml,
    };
    this.mailService.sendEmail(email);
  }

  @Post('/reset-password')
  @UseGuards(AuthGuard)
  async resetPassword(
    @CurrentUser() user: User,
    @Body() resetPasswordDto: ResetPasswordDto,
  ) {
    return this.authService.resetPassword(user.userId, resetPasswordDto);
  }
}
