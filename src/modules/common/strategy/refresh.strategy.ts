import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { JwtPayload } from './jwt.strategy';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies['auth._refresh_token.local'];
        },
      ]),
      passReqToCallback: true,
      secretOrKey: configService.get('JWT_REFRESH_SECRET'),
    });
  }

  async validate(request: Request, payload: JwtPayload) {
    const refreshToken = request?.cookies['auth._refresh_token.local'];

    return { ...payload, refreshToken };
  }
}
