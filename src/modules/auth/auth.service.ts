import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma';
import { ConfigService } from '@nestjs/config';
import { I18nContext, logger } from "nestjs-i18n";
import { RegisterPayload } from './payloads/register.payload';
import { UsersService } from '../users';
import { ProviderSocial, UserRole, UserStatus } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { LoginPayload } from './payloads/login.payload';
import { MailService } from '../mail/mail.service';
import { ResetPayload } from './payloads/reset.payload';
import { ForgotPasswordPayload } from './payloads/forgot.payload';
import { NewPasswordPayload } from './payloads/password.payload';
import { TokenResponse } from './dto/interface.dto';
import { Hash } from "../../utils/Hash";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}
  // REGISTER PROCESS
  async register(
    registerPayload: RegisterPayload,
    i18n: I18nContext,
  ): Promise<TokenResponse> {
    // Validate user
    const userExists = await this.prisma.user.findUnique({
      where: { email: registerPayload.email },
    });
    if (userExists) {
      this.logger.error(
        `Registration failed: Email ${registerPayload.email} already exists`,
      );
      throw new ConflictException(i18n.t('error.user_already_existed'));
    }
    // Create new user
    const newUser = await this.userService.save(
      registerPayload,
      UserStatus.IN_ACTIVE,
      UserRole.STUDENT,
    );

    // Generate tokens
    const tokens = await this.getTokens(newUser.id);

    // Update refresh token
    await this.updateVerifyRefreshToken(newUser.id, tokens.refreshToken);

    // Send verification email
    await this.mailService.sendMailVerification(
      newUser.email,
      tokens.accessToken
    );

    return {
      message: i18n.t('event.register_success'),
      ...tokens,
    };
  }

  // LOGIN PROCESS
  async login(
    loginPayload: LoginPayload,
    i18n: I18nContext,
  ): Promise<TokenResponse> {
    // validate user
    const user = await this.validateUser(loginPayload.email, i18n);
    // Check password
    const isPasswordValid = await Hash.compare(
      loginPayload.password,
      user.password,
    );
    if (!isPasswordValid) {
      this.logger.error(
        `Login failed: Invalid password for user ${loginPayload.email}`,
      );
      throw new BadRequestException(i18n.t('error.invalid_credential'));
    }
    // Generate tokens
    const token = await this.getTokens(user.id);
    // Update refresh token
    await this.updateVerifyRefreshToken(user.id, token.refreshToken);
    return {
      message: i18n.t('event.login_success'),
      ...token,
    };
  }

  // LOGOUT PROCESS
  async logout(userId: string) {
    logger.log(`User Id: ${userId} logged out`);
    return await this.prisma.user.update({
      where: { id: userId },
      data: {
        refresh_token: null,
      },
    });
  }

  // RESET PASSWORD PROCESS
  async resetPassword(reset: ResetPayload, i18n: I18nContext) {
    // validate user
    const user = await this.userService.findEmail(reset.email, i18n);
    if (!user) {
      throw new BadRequestException(i18n.t('error.user_not_exist'));
    }
    // verify token
    const tokenVerify = await this.verifyResetToken(reset.token, i18n);
    if (tokenVerify.email !== reset.email) {
      throw new BadRequestException(i18n.t('error.mismatched_email'));
    }
    // update password
    await this.userService.updateUserPassword(user.id, reset.password);
    await this.prisma.verificationToken
      .update({
        where: { id: tokenVerify.token.id },
        data: {
          token: tokenVerify.token.token,
          expires: tokenVerify.token.expires,
        },
      })
      .then(() => {
        this.logger.log(`Token: ${tokenVerify.token.token} marked as done!`);
      });
    return {
      message: i18n.t('event.password_reset_successful'),
    };
  }

  // RESET EMAIL PROCESS
  async resetEmail(resetEmail: ResetPayload, i18n: I18nContext) {
    // validate user
    const user = await this.prisma.user.findFirst({
      where: { refresh_token: resetEmail.token },
    });
    if (!user) {
      throw new BadRequestException(i18n.t('error.user_not_exist'));
    }
    // validate user
    const tokenVerify = await this.verifyResetToken(resetEmail.token, i18n);
    if (tokenVerify.email !== resetEmail.email) {
      throw new BadRequestException(i18n.t('error.mismatched_email'));
    }

    // update email
    const userUpdate = await this.prisma.user.update({
      where: { email: user.email },
      data: {
        email: resetEmail.email,
        emailVerified: new Date(),
      },
    });
    // generate tokens
    const tokens = await this.getTokens(userUpdate.id);
    // update refresh token
    await this.updateVerifyRefreshToken(userUpdate.id, tokens.refreshToken);
    // send mail
    await this.mailService.sendMailVerification(
      resetEmail.email,
      tokens.refreshToken,
    );
    // update table verification token
    await this.prisma.verificationToken
      .update({
        where: { id: tokenVerify.token.id },
        data: {
          token: tokens.refreshToken,
          expires: new Date(tokens.expires),
        },
      })
      .then(() => {
        this.logger.log(`Token: ${tokenVerify.token.token} marked as done!`);
      });
    return tokens;
  }

  async forgotPassword(
    forgotPassword: ForgotPasswordPayload,
    i18n: I18nContext,
  ) {
    const user = await this.userService.findEmail(forgotPassword.email, i18n);
    if (!user) {
      throw new BadRequestException(i18n.t('error.user_not_exist'));
    }
    const token = await this.getTokens(user.id);
    await this.mailService.sendMailPasswordReset(
      user.email,
      token.refreshToken,
      token.expires.getTime(),
    );
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

    const tokens = await this.getTokens(user.id);

    await this.updateVerifyRefreshToken(user.email, tokens.refreshToken);
    return tokens;
  }

  async refreshToken(userId: string, refreshToken: string) {
    const user = await this.prisma.user.findFirst({ where: { id: userId } });
    if (!user) throw new ForbiddenException('User Access Denied');
    const isRefreshTokenValid = await Hash.compare(
      refreshToken,
      user.refresh_token,
    );
    this.logger.log(`User Id :${userId} and refresh token: ${refreshToken}`);
    if (!isRefreshTokenValid) throw new ForbiddenException('User Access Denied');
    const token = await this.getTokens(user.id);
    await this.updateVerifyRefreshToken(user.id, token.refreshToken);
    return token;
  }

  async handleAuth(req, provider: ProviderSocial, name: string) {
    const users = req.user;
    const existingUser = await this.userService.findEmail(
      users.email,
      req.i18n,
    );
    const createToken = async () => {
      const token = await this.getTokens(users.id);
      await this.updateVerifyRefreshToken(users.id, token.refreshToken);
      return token;
    };
    if (existingUser) {
      const providerIntegration = await this.userService.getIntegrationById(
        existingUser.id,
      );
      if (providerIntegration.some((object) => object.provider === provider)) {
        return await createToken();
      }
      await this.prisma.account.create({
        data: {
          user: { connect: { id: existingUser.id } },
          provider: provider,
          providerAccountId: users.id,
          byUser: existingUser.id,
          type: 'read:user',
        },
      });
      return await createToken();
    }
    const payload = {
      email: users.email,
      name,
      password: existingUser.password,
    };
    const newUser = await this.userService.save(
      payload,
      UserStatus.ACTIVE,
      UserRole.STUDENT,
    );
    await this.prisma.account.create({
      data: {
        byUser: newUser.id,
        provider: provider,
        providerAccountId: users.id,
        userId: newUser.id,
        type: 'read:user',
      },
    });
    const token = await this.getTokens(newUser.id);
    await this.updateVerifyRefreshToken(newUser.id, token.refreshToken);
    return token;
  }

  async getTokens(userId: string) {
    const accessTokenExpiry = this.configService.get(
      'JWT_EXPIRATION_TIME',
    );
    const refreshTokenExpiry = this.configService.get(
      'JWT_REFRESH_EXPIRATION_TIME',
    );

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          id: userId,
        },
        {
          secret: this.configService.get<string>('JWT_SECRET_KEY'),
          expiresIn: accessTokenExpiry,
        },
      ),
      this.jwtService.signAsync(
        {
          id: userId,
        },
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
          expiresIn: refreshTokenExpiry,
        },
      ),
    ]);
    return {
      accessToken: accessToken,
      refreshToken: refreshToken,
      expires: new Date(Date.now() + parseInt(accessTokenExpiry) * 1000),
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

  async updateVerifyRefreshToken(userId: string, token: string) {
    const hashedRefreshToken = await Hash.make(token);
    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        refresh_token: hashedRefreshToken,
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
        secret: this.configService.get('JWT_VERIFICATION_TOKEN_SECRET'),
      });
      this.logger.log(`Token: ${token} decoded: ${JSON.stringify(payload)}`);
      console.log(payload);
      if (typeof payload === 'object' && 'email' in payload) {
        return payload.email;
      }
      throw new BadRequestException();
    } catch (error) {
      if (error?.name === 'TokenExpiredError') {
        throw new BadRequestException(i18n.t('error.token_expired'));
      }
      throw new BadRequestException(i18n.t('error.invalid_token'));
    }
  }

  async createEmail(email: string, i18n: I18nContext) {
    const user = await this.prisma.user.findUnique({
      where: { email }
    });
  
    if (!user) {
      throw new BadRequestException(i18n.t('error.user_not_exist'));
    }
  
    await this.prisma.user.update({
      where: { email },
      data: {
        emailVerified: new Date(),
        status: UserStatus.ACTIVE
      }
    });
    return { email: email, message: i18n.t('event.email_already_conformed') };
  }
}
