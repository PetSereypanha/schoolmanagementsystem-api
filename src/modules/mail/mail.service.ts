import { Injectable } from '@nestjs/common';
import type { ResendService } from 'nestjs-resend';
import type { ConfigService } from '@nestjs/config';
import { viewsEmailTemplate } from './tamplate/tamplate';

@Injectable()
export class MailService {
  private domain: string;
 
   constructor(
     private readonly resendService: ResendService,
     private readonly configService: ConfigService,
   ) {
     this.domain = this.configService.get<string>('APP_URL');
   }
 
   async sendTwoFactorToken(email: string, token: string) {
     return this.resendService.send({
       from: 'edu <schoolse4group14.space>',
       to: email,
       subject: '2FA Code',
       html: `<p>Your 2FA code: ${token}</p>`,
     });
   }
 
   async sendPasswordReset(email: string, token: string) {
     const resetLink = `${this.domain}/auth/new-password?token=${token}`;
 
     return this.resendService.send({
       from: 'edu <schoolse4group14.space>',
       to: email,
       subject: 'Reset your password',
       html: viewsEmailTemplate({ 
         url: resetLink, 
         titleEmail: 'Reset Password' 
       }),
     });
   }
 
   async sendVerification(email: string, token: string) {
     const confirmLink = `${this.domain}/auth/new-verification?token=${token}`;
 
     return this.resendService.send({
       from: 'edu <schoolse4group14.space>',
       to: email,
       subject: 'Confirm your email',
       html: viewsEmailTemplate({ 
         url: confirmLink, 
         titleEmail: 'Verification Account' 
       }),
     });
   }
}

