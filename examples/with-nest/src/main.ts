import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ReactusService } from './reactus/reactus.service.js';
import { join } from 'path';
import sirv from 'sirv';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const express = app.getHttpAdapter().getInstance();
  const cwd = process.cwd();
  
  const reactusService = app.get(ReactusService);

  // Serve static assets in production
  if (process.env.NODE_ENV === 'production') {
    express.use(
      '/client',
      sirv(join(cwd, 'public/client'), { maxAge: 31536000, immutable: true })
    );
    express.use(
      '/assets',
      sirv(join(cwd, 'public/assets'), { maxAge: 31536000, immutable: true })
    );
    express.use(
      '/public',
      sirv(join(cwd, 'public'), { maxAge: 31536000, immutable: true })
    );
  }

  // In dev mode, use the Reactus service for rendering and asset handling
  express.use(async (req, res, next) => {
    if (process.env.NODE_ENV !== 'production') {
      // Handle assets and rendering in dev mode
      await reactusService.handleAssets(req, res);
    }
    if (!res.headersSent) next();
  });

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Server is listening at http://localhost:${process.env.PORT ?? 3000}`);
}

bootstrap().catch((e) => {
  console.error(e);
  process.exit(1);
});
