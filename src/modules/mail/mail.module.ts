import { Module } from '@nestjs/common';
import { ResendModule } from 'nestjs-resend';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';

@Module({
  imports: [
    ResendModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        apiKey: configService.get('RESEND_API_KEY'),
      }),
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class EmailModule {}
