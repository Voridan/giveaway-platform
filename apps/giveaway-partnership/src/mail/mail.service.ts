import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Email } from './types/email';

@Injectable()
export class MailService {
  private readonly transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: this.config.get<string>('APP_MAIL'),
        pass: this.config.get<string>('MAIL_APP_PASSWORD'),
      },
    });
  }

  sendEmail(email: Email) {
    return this.transporter.sendMail(email);
  }
}
