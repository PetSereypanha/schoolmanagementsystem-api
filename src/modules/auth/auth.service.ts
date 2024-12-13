import { BadRequestException, ConflictException, Injectable, Logger } from '@nestjs/common';
import { Sign } from 'crypto';
import { PrismaService } from '../prisma';
import { ConfigService } from '@nestjs/config';
import { I18nContext } from 'nestjs-i18n';
import { RegisterPayload } from './payloads/register.payload';
import { UsersService } from '../users';
import { UserRole, UserStatus } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { Hash } from 'src/utils/Hash';
import { emit } from 'process';
import { EmailService } from '../email/email.service';
import { LoginPayload } from './payloads/login.payload';

@Injectable()
export class AuthService {
  private readonly  logger = new Logger(AuthService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly userService:  UsersService,
    private readonly emailService : EmailService,
    private readonly jwtService: JwtService,
  ) {}
  async register(registerPayload: RegisterPayload, i18n: I18nContext) {
    const { email } = registerPayload;
    const userExists = await this.prisma.user.findUnique({
      where: {
        email,
      },
    })
    if (userExists) {
      throw new ConflictException(i18n.t('error.user_already_existed'));
    }
    const newUser = await this.userService.save(
      registerPayload,
      UserStatus.IN_ACTIVE,
      UserRole.STUDENT
    );

    const token = await this.getTokens(newUser.email);
    await this.updateRefreshToken(
      newUser.email,
      token.refreshToken,
      new Date(Date.now() + Number(this.configService.get('JWT_REFRESH_EXPIRATION_TIME'))),
    );
    await this.emailService.sendVerification(newUser.email, token.refreshToken);
    return token;
  }

  async login(loginPayload: LoginPayload, i18n: I18nContext) {
    const user = await this.validateUser(loginPayload.email, i18n);
    const token = await this.getTokens(user.email);
    await this.updateRefreshToken(user.email, token.refreshToken, new Date(Date.now() + Number(this.configService.get('JWT_REFRESH_EXPIRATION_TIME'))));
    return token;
  }

  async resetPassword(email: string, i18n: I18nContext) {
    const user = await this.userService.findEmail(email, i18n);
    if (!user) {
      throw new BadRequestException(i18n.t('error.user_not_exist'));
    }
    const verirfied = await this.verifyResetToken(user., i18n);

  }

  async resetEmail(email: string, i18n: I18nContext) {

  }

  async getTokens(email: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          id: email,
        },
        {
          secret: this.configService.get<string>('JWT_SECRET_KEY'),
          expiresIn: Number(this.configService.get('JWT_EXPIRATION_TIME')),
        },
      ),
      this.jwtService.signAsync(
        {
          id: email,
        },
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
          expiresIn: Number(
            this.configService.get('JWT_REFRESH_EXPIRATION_TIME'),
          ),
        },
      ),
    ]);
    return {
      accessToken: accessToken,
      refreshToken: refreshToken,
    };
  }

  async verifyResetToken(token: string, i18n: I18nContext) {
    const resetToken = await this.prisma.verificationToken.findFirst({
      where: {
        token,
      },
    });
    if (!resetToken) {
      throw new BadRequestException(i18n.t('error.token_not_exist'));
    }
    if (resetToken.expires < new Date()) {
      throw new BadRequestException(i18n.t('error.token_already_used'));
    }
    const email = await this.decodeConfirmToken(token, i18n);
    return {
      email,
      token: resetToken,
    };
  }

  async updateRefreshToken(email: string, token: string, date: Date) {
    const refreshToken = await this.prisma.verificationToken.findFirst({
      where:{ email },
    });
    if(!refreshToken) {
      await this.prisma.verificationToken.create({
        data: {
         email,
         token,
         expires: date
        }
       });
    }
    await this.prisma.verificationToken.update({
      where: {
        id : refreshToken.id,
      },
      data: {
        token,
        expires: date,
      },
    });
  }

  async validateUser(email: string, i18n: I18nContext) {
    const user = await this.userService.findEmail(email, i18n);
    if (!user) {
      throw new BadRequestException(i18n.t('error.user_already_existed'));
    }
    return user;
  }

  async decodeConfirmToken(token: string, i18n: I18nContext) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_VERIFICATION_TOKEN_SECRET'),
      });
      if  ( typeof payload === 'object' && 'email' in payload) {
        return payload.email;
      }
    } catch (error) {
      if (error?.name === 'TokenExpiredError') {
        throw new BadRequestException(i18n.t('error.token_expired'));
      }
      throw new BadRequestException(i18n.t('error.invalid_token'));
    }
  }

}
