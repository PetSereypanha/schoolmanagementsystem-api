import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from 'src/app/app.module';
import { CustomExceptionFilter } from './modules/common/filter/custom-exception.filter';
import { PrismaExceptionFilter } from './modules/common/filter/prisma-exception.filter';
import { ConfigService } from '@nestjs/config';
import { setupSwagger } from 'src/swagger';
import { I18nMiddleware, I18nValidationExceptionFilter, I18nValidationPipe } from "nestjs-i18n";

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
  app.use(I18nMiddleware);
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.useGlobalFilters(
    new CustomExceptionFilter(),
    new PrismaExceptionFilter(),
    new I18nValidationExceptionFilter(),
  );
  const port = configService.get('PORT', 3001);
  await app.listen(port);
  console.log(`
    🚀 Server ready at: http://localhost:${port}
    📚 Swagger Docs at: http://localhost:${port}/api/docs
  `);

}
bootstrap();