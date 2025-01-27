import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaService } from '../prisma';
import { JwtStrategy } from '../common/strategy/jwt.strategy';
import { RefreshTokenStrategy } from '../common/strategy/refresh.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users';
import { MailModule } from '../mail/mail.module';
import { PassportModule } from '@nestjs/passport';
import { FacebookStrategy } from "../common/strategy/facebook.strategy";
import { GoogleStrategy } from "../common/strategy/google.strategy";

@Module({
  imports: [
    ConfigModule,
    UsersModule,
    MailModule,
    JwtModule.register({}),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        return {
          secret: configService.get<string>('JWT_SECRET_KEY'),
          signOptions: {
            ...(configService.get<string>('JWT_EXPIRATION_TIME')
              ? {
                  expiresIn: Number(configService.get('JWT_EXPIRATION_TIME')),
                }
              : {}),
          },
        };
      },
      inject: [ConfigService],
    }),

    // JwtModule.registerAsync({
    //   imports: [ConfigModule],
    //   inject: [ConfigService],
    //   useFactory: async (configService: ConfigService) => ({
    //     secret: configService.get<string>('JWT_SECRET_KEY'),
    //     signOptions: {
    //       expiresIn: configService.get('JWT_EXPIRATION_TIME'),
    //     },
    //   }),
    // }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PrismaService, JwtStrategy, RefreshTokenStrategy, FacebookStrategy, GoogleStrategy],
  exports: [AuthService],
})
export class AuthModule {}
