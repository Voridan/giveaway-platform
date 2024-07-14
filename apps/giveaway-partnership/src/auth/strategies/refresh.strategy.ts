import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayloadWithRt } from '../types';
import { Request } from 'express';
import { Injectable } from '@nestjs/common';

@Injectable()
export class RefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          let token = null;
          if (req && req.cookies) {
            token = req.cookies['jwt'];
          }
          return token;
        },
      ]),
      secretOrKey: configService.get<string>('JWT_REFRESH'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayloadWithRt) {
    const refreshToken = req.cookies['jwt'];
    return { ...payload, refreshToken };
  }
}
