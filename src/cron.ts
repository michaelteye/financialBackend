import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { CronModule } from './modules/cron/cron.module';

async function bootstrap() {
  const app = await NestFactory.create(CronModule);
  app.enableCors({
    origin: /.*/,
  });
  app.useGlobalPipes(new ValidationPipe());
  app.setGlobalPrefix('api/v2');

  const rand = Math.floor(1000 + Math.random() * 900)
  await app.listen(rand);
}
bootstrap();
