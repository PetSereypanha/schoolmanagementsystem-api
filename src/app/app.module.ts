import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { AppController } from './app.controller';
import { TransformInterceptor } from 'src/modules/common/interceptor/transform.interceptor';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { TimeoutInterceptor } from 'src/modules/common/interceptor/timeout.interceptor';
import { UsersModule } from 'src/modules/users/users.module';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisConfig } from 'src/modules/common/config';
import { NoCacheInterceptor } from 'src/modules/common/interceptor/no-cache.interceptor';
import {
  I18nModule,
  AcceptLanguageResolver,
  QueryResolver,
  I18nJsonLoader,
} from 'nestjs-i18n';
import * as path from 'path';
import { RolesGuard } from 'src/modules/common/guard/roles.guard';
import { JwtAuthGuard } from 'src/modules/common/guard/jwt.guard';
import { AuthModule } from 'src/modules/auth/auth.module';
import { EmailModule } from 'src/modules/mail/mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    I18nModule.forRootAsync({
      useFactory: () => ({
        fallbackLanguage: 'kh',
        loader: I18nJsonLoader,
        loaderOptions: {
          path: path.join(__dirname, '../i18n/'),
          watch: true,
        },
        typesOutputPath: path.join(
          __dirname,
          '../common/generated/i18n.generated.ts',
        ),
      }),
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        AcceptLanguageResolver,
      ],
    }),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: redisConfig,
      isGlobal: true,
    }),
    AuthModule,
    UsersModule,
    EmailModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TimeoutInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: NoCacheInterceptor,
    },
  ],
})
export class AppModule {}
