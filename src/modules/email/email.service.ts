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
      from: 'edu <noreply@schoolse4group14.space>',
      to: email,
      subject: '2FA Code',
      html: `<p>Your 2FA code: ${token}</p>`,
    });
  }

  async sendPasswordReset(email: string, token: string) {
    const resetLink = `${this.domain}/auth/new-password?token=${token}`;

    return this.resendService.send({
      from: 'edu <noreply@schoolse4group14.space>',
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
      from: 'edu <noreply@schoolse4group14.space>',
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
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: #004d99;
            color: white;
            text-align: center;
            padding: 20px;
            border-radius: 8px 8px 0 0;
          }
          .content {
            background: #ffffff;
            padding: 30px;
            border: 1px solid #e1e1e1;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background: #004d99;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            padding: 20px;
            color: #666;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>School Management System</h1>
          </div>
          <div class="content">
            <h2>${template.titleEmail}</h2>
            <p>Please click the button below to continue:</p>
            <a href="${template.url}" class="button">${template.titleEmail}</a>
            <p>If you did not request this email, please ignore it.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} School Management System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}