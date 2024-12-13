import { BadRequestException, ConflictException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { ConfigService } from '@nestjs/config';
import { I18nContext } from 'nestjs-i18n';
import { RegisterPayload } from './payloads/register.payload';
import { UsersService } from '../users';
import { UserRole, UserStatus } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { Hash } from 'src/utils/Hash';
import { emit } from 'process';
import { LoginPayload } from './payloads/login.payload';
import type { MailService } from '../mail/mail.service';
import type { ResetPayload } from './payloads/reset.payload';
import type { ForgotPasswordPayload } from './payloads/forgot.payload';
import type { NewPasswordPayload } from './payloads/password.payload';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly userService: UsersService,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
  ) {}
  async register(registerPayload: RegisterPayload, i18n: I18nContext) {
    const { email } = registerPayload;
    const userExists = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });
    if (userExists) {
      throw new ConflictException(i18n.t('error.user_already_existed'));
    }
    const newUser = await this.userService.save(
      registerPayload,
      UserStatus.IN_ACTIVE,
      UserRole.STUDENT,
    );

    const token = await this.getTokens(newUser.email);
    await this.updateVerifyRefreshToken(
      newUser.email,
      token.refreshToken,
      new Date(
        Date.now() +
          Number(this.configService.get('JWT_REFRESH_EXPIRATION_TIME')),
      ),
    );
    await this.mailService.sendVerification(newUser.email, token.refreshToken);
    return token;
  }

  async login(loginPayload: LoginPayload, i18n: I18nContext) {
    const { email } = loginPayload;
    const user = await this.validateUser(email, i18n);
    const isPasswordValid = await Hash.compare(user.password, loginPayload.password);
    if (!isPasswordValid) {
      this.logger.error(`Login failed: Invalid password for user ${email}`);
      throw new BadRequestException(i18n.t('error.invalid_credential'));
    }
    const token = await this.getTokens(user.email);
    await this.updateVerifyRefreshToken(
      user.email,
      token.refreshToken,
      new Date(
        Date.now() +
          Number(this.configService.get('JWT_REFRESH_EXPIRATION_TIME')),
      ),
    );
    return token;
  }

  async resetPassword(reset: ResetPayload, i18n: I18nContext) {
    const user = await this.userService.findEmail(reset.email, i18n);
    if (!user) {
      throw new BadRequestException(i18n.t('error.user_not_exist'));
    }
    const tokenVerify = await this.verifyResetToken(reset.token, i18n);
    if (tokenVerify.email !== reset.email) {
      throw new BadRequestException(i18n.t('error.mismatched_email'));
    }
    this.userService.updateUserPassword(reset, i18n);
    await this.mailService.sendPasswordReset(
      reset.email,
      tokenVerify.token.token,
    );
    return { message: 'Password reset Successful' };
  }

  async resetEmail(resetEmail: ResetPayload, i18n: I18nContext) {
    
    const user = await this.updateNewRefreshToken(resetEmail.email, resetEmail.token, new Date(Date.now() + Number(this.configService.get('JWT_REFRESH_EXPIRATION_TIME'))));

  }

  async forgotPassword(
    forgotPassword: ForgotPasswordPayload,
    i18n: I18nContext,
  ) {
    const user = await this.userService.findEmail(forgotPassword.email, i18n);
    if (!user) {
      throw new BadRequestException(i18n.t('error.user_not_exist'));
    }
    const token = await this.getTokens(user.email);
    await this.mailService.sendVerification(user.email, token.refreshToken);
    return { message: 'Password reset Successful' };
  }

  async newPassword(newPassword: NewPasswordPayload, i18n: I18nContext) {
    const decoded = await this.decodeConfirmToken(newPassword.token, i18n);
    if (!decoded) {
      throw new BadRequestException(i18n.t('error.invalid_token'));
    }

    const user = await this.userService.findEmail(decoded, i18n);
    if (!user) {
      throw new BadRequestException(i18n.t('error.user_not_exist'));
    }

    const tokens = await this.getTokens(user.email);

    await this.updateNewRefreshToken(
      user.email,
      tokens.refreshToken,
      new Date(
        Date.now() +
          Number(this.configService.get('JWT_REFRESH_EXPIRATION_TIME')),
      ),
    );
    return tokens;
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

  async updateVerifyRefreshToken(email: string, token: string, date: Date) {
    const refreshToken = await this.prisma.verificationToken.findFirst({
      where: { email },
    });
    if (!refreshToken) {
      await this.prisma.verificationToken.create({
        data: {
          email,
          token,
          expires: date,
        },
      });
    }
    await this.prisma.verificationToken.update({
      where: {
        id: refreshToken.id,
      },
      data: {
        token,
        expires: date,
      },
    });
  }

  async updateNewRefreshToken(email: string, token: string, date: Date) {
    const refreshToken = await this.prisma.verificationToken.findFirst({
      where: { email },
    });
    if (!refreshToken) {
      await this.prisma.verificationToken.create({
        data: {
          email,
          token,
          expires: date,
        },
      });
    }
    await this.prisma.verificationToken.update({
      where: {
        id: refreshToken.id,
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
      if (typeof payload === 'object' && 'email' in payload) {
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
