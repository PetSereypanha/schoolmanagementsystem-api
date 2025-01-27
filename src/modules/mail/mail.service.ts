import { Injectable, Logger } from '@nestjs/common';
import { ResendService } from 'nestjs-resend';
import { ConfigService } from '@nestjs/config';
import { viewsEmailTemplate } from './tamplate/tamplate';
import { PrismaService } from '../prisma';

@Injectable()
export class MailService {
  private domain: string;
  private readonly logger = new Logger(MailService.name);
  private readonly FROM_EMAIL =
    'School Education <noreply@schoolse4group14.space>';

  constructor(
    private readonly resendService: ResendService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.domain = this.configService.get<string>('APP_URL');
    if (!this.configService.get('RESEND_API_KEY')) {
      this.logger.error('RESEND_API_KEY not configured');
    }
    if (!this.domain) {
      this.logger.error('APP_URL not configured');
    }
  }

  async sendMailTwoFactorToken(email: string, token: string) {
    try {
      const result = await this.resendService.send({
        from: this.FROM_EMAIL,
        to: email,
        subject: '2FA Code',
        html: `<p>Your 2FA code: ${token}</p>`,
      });
      this.logger.log(`2FA email sent to ${email}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to send 2FA email to ${email}:`, error);
      throw error;
    }
  }

  async sendMailPasswordReset(email: string, token: string, date: number) {
    try {
      const resetLink = `${this.domain}/auth/new-password?token=${token}`;
      this.prisma.passwordResetToken
        .create({
          data: {
            token,
            email,
            expires: new Date(date),
          },
        })
        .then(() => {
          this.logger.log(`Password reset created successfully: ${email}`);
        });
      const result = await this.resendService.send({
        from: this.FROM_EMAIL,
        to: email,
        subject: 'Reset Password',
        html: viewsEmailTemplate({
          url: resetLink,
          titleEmail: 'Reset Password',
        }),
      });
      this.logger.log(`Reset Password email sent to ${email}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to send Reset Password email to ${email}:`,
        error,
      );
      throw error;
    }
  }

  async sendMailVerification(email: string, token: string) {
    try {
      const confirmLink = `${this.domain}/auth/confirm-email?token=${token}`;

      const result = await this.resendService.send({
        from: this.FROM_EMAIL,
        to: email,
        subject: 'Welcome to SMS - Verify Your Email',
        html: viewsEmailTemplate({
          url: confirmLink,
          titleEmail: 'Verify Your Email Address',
        }),
      });

      this.logger.log(`Verification email sent to ${email}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to send verification email to ${email}:`,
        error,
      );
      throw error;
    }
  }
}
