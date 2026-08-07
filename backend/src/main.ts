import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
  );

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);

  if (process.env.WEBHOOK_PROXY_URL) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const SmeeClient = require('smee-client');
    const smee = new SmeeClient({
      source: process.env.WEBHOOK_PROXY_URL,
      target: `http://localhost:${process.env.PORT ?? 3000}/api/github/webhook`,
      logger: console,
    });
    smee.start();
  }
}

bootstrap();