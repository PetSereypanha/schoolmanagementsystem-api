import { Injectable, Logger } from '@nestjs/common';
import { ResendService } from 'nestjs-resend';
import { ConfigService } from '@nestjs/config';
import { viewsEmailTemplate } from './tamplate/tamplate';
import { PrismaService } from '../prisma';

@Injectable()
export class MailService {
  private domain: string;
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly resendService: ResendService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.domain = this.configService.get<string>('APP_URL');
  }

  async sendMailTwoFactorToken(email: string, token: string) {
    return this.resendService.send({
      from: 'edu <schoolse4group14.space>',
      to: email,
      subject: '2FA Code',
      html: `<p>Your 2FA code: ${token}</p>`,
    });
  }

  async sendMailPasswordReset(email: string, token: string, date: number) {
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
    return this.resendService.send({
      from: 'edu <schoolse4group14.space>',
      to: email,
      subject: 'Reset Password',
      html: viewsEmailTemplate({
        url: resetLink,
        titleEmail: 'Reset Password',
      }),
    });
  }

  async sendMailVerification(email: string, token: string) {
    const confirmLink = `${this.domain}/auth/new-verification?token=${token}`;

    return this.resendService.send({
      from: 'edu <schoolse4group14.space>',
      to: email,
      subject: 'Welcome to SMS',
      html: viewsEmailTemplate({
        url: confirmLink,
        titleEmail: 'Verification Account',
      }),
    });
  }
}
