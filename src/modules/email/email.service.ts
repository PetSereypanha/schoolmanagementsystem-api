import { Injectable } from '@nestjs/common';
import { ResendService } from 'nestjs-resend';
import { ConfigService } from '@nestjs/config';

export interface EmailTemplate {
    url?: string;
    titleEmail?: string;
}

@Injectable()
export class EmailService {
  private domain: string;

  constructor(
    private readonly resendService: ResendService,
    private readonly configService: ConfigService,
  ) {
    this.domain = this.configService.get<string>('APP_URL');
  }

  async sendTwoFactorToken(email: string, token: string) {
    return this.resendService.send({
      from: 'Ixu <noreply@ixuapps.online>',
      to: email,
      subject: '2FA Code',
      html: `<p>Your 2FA code: ${token}</p>`,
    });
  }

  async sendPasswordReset(email: string, token: string) {
    const resetLink = `${this.domain}/auth/new-password?token=${token}`;

    return this.resendService.send({
      from: 'Ixu <noreply@ixuapps.online>',
      to: email,
      subject: 'Reset your password',
      html: this.getEmailTemplate({ 
        url: resetLink, 
        titleEmail: 'Reset Password' 
      }),
    });
  }

  async sendVerification(email: string, token: string) {
    const confirmLink = `${this.domain}/auth/new-verification?token=${token}`;

    return this.resendService.send({
      from: 'Ixu <noreply@ixuapps.online>',
      to: email,
      subject: 'Confirm your email',
      html: this.getEmailTemplate({ 
        url: confirmLink, 
        titleEmail: 'Verification Account' 
      }),
    });
  }

  private getEmailTemplate(template: EmailTemplate): string {
    return `
      <div>
        <h1>${template.titleEmail}</h1>
        <p>Click the link below:</p>
        <a href="${template.url}">${template.titleEmail}</a>
      </div>
    `;
  }
}