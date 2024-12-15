import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ResendModule } from 'nestjs-resend';
import { MailService } from './mail.service';
import { PrismaService } from '../prisma';

@Module({
  imports: [
    ConfigModule,
    ResendModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        apiKey: configService.get('RESEND_API_KEY'),
      }),
    }),
  ],
  providers: [MailService, PrismaService],
  exports: [MailService],
})
export class MailModule {}
