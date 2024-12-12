import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from 'src/app/app.module';
import { CustomExceptionFilter } from './modules/common/filter/custom-exception.filter';
import { PrismaClientExceptionFilter } from './modules/common/filter/prisma-exception.filter';
import { ConfigService } from '@nestjs/config';
import { setupSwagger } from 'src/swagger';
import { I18nService, I18nValidationPipe } from 'nestjs-i18n';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  if (configService.get('APP_ENV') == 'dev') {
    setupSwagger(app);
  }
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept',
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      validationError: { target: false },
    }),
    new I18nValidationPipe(),
  );
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.useGlobalFilters(
    new CustomExceptionFilter(app.get(I18nService)),
    new PrismaClientExceptionFilter(),
  );
  await app.listen(3001);
}
bootstrap();
