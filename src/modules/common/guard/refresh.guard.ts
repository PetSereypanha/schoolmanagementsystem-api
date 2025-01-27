import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class RefreshTokenGuard extends AuthGuard('jwt-refresh') {
    constructor() {
        super();
      }
    
      handleRequest(err: any, user: any, info: any) {
        if (err || !user) {
          throw new UnauthorizedException('Invalid refresh token');
        }
        return user;
      }
}
