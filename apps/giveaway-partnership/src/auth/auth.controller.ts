import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginUserDto } from '../users/dto/login-user.dto';
import { AuthService } from './auth.service';
import { MailService } from '../mail/mail.service';
import { JwtPayload, JwtPayloadWithRt } from './types';
import { RefreshGuard } from '../guards';
import { CurrentUser, PublicRoute } from '../decorators';
import { Email } from '../mail/types/email';
import { getResetPasswordEmailHtml } from './util/get-reset-password-email';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Serialize } from '../interceptors/serialize.interceptor';
import { Response } from 'express';
import { AuthResponseDto } from './dto/auth-response.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
    private readonly mailService: MailService,
  ) {}

  @PublicRoute()
  @Post('/local/signup')
  @Serialize(AuthResponseDto)
  async signupLocal(
    @Query('admin') adminSecret: string,
    @Body() body: CreateUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (adminSecret) {
      if (adminSecret === this.config.get<string>('ADMIN_ENDPOINT'))
        body.isAdmin = true;
      else throw new BadRequestException('Wrong secret');
    }

    const { user, tokens } = await this.authService.signupLocal(body);
    this.attachTokenToCookie(res, tokens.refreshToken);
    return { user, accessToken: tokens.accessToken };
  }

  @PublicRoute()
  @Post('/local/login')
  @Serialize(AuthResponseDto)
  async loginLocal(
    @Body() loginUserDto: LoginUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, tokens } = await this.authService.loginLocal(loginUserDto);
    this.attachTokenToCookie(res, tokens.refreshToken);
    return { ...user, accessToken: tokens.accessToken };
  }

  @Get('/logout')
  logout(
    @CurrentUser('sub') userId: number,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.dettachTokenToCookie(res);
    return this.authService.logout(userId);
  }

  @Get('/refresh')
  @PublicRoute()
  @UseGuards(RefreshGuard)
  @Serialize(AuthResponseDto)
  async refresh(
    @CurrentUser() userJwt: JwtPayloadWithRt,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, tokens } = await this.authService.refresh(
      userJwt.sub,
      userJwt.refreshToken,
    );
    this.attachTokenToCookie(res, tokens.refreshToken);
    return { ...user, accessToken: tokens.accessToken };
  }

  @Post('/forgot-password')
  async forgotPassword(@CurrentUser() user: JwtPayload) {
    const secret = await this.authService.generateResetPasswordTokenAndSave(
      user.email,
    );

    const frontendUrl = this.config.get<string>('FRONTEND_URL');
    const resetUrl = `${frontendUrl}/reset-password?secret=${secret}`;

    const emailHtml = getResetPasswordEmailHtml(user.email, resetUrl);
    const email: Email = {
      from: this.config.get<string>('APP_MAIL'),
      to: user.email,
      subject: 'Password reset',
      html: emailHtml,
    };
    this.mailService.sendEmail(email);
  }

  @Post('/reset-password')
  async resetPassword(
    @CurrentUser() user: JwtPayload,
    @Body() resetPasswordDto: ResetPasswordDto,
  ) {
    return this.authService.resetPassword(user.sub, resetPasswordDto);
  }

  private attachTokenToCookie(res: Response, rt: string) {
    res.cookie('jwt', rt, {
      httpOnly: true,
      secure: true,
      maxAge: 24 * 60 * 60 * 1000,
    });
  }

  private dettachTokenToCookie(res: Response) {
    res.clearCookie('jwt', {
      httpOnly: true,
      secure: true,
    });
  }
}
