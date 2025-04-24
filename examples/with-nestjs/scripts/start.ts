import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import sirv from 'sirv';

import { serve } from 'reactus';

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { AppService } from '../src/app.service';

async function start() {
  const cwd = process.cwd();

  // Start NestJS without listening (manual server)
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  await app.init();

  // Get NestJS service
  const appService = app.get(AppService);

  // Set up Reactus renderer
  const engine = serve({
    cwd,
    clientRoute: '/client',
    pagePath: path.join(cwd, '.build/pages'),
    cssRoute: '/assets',
  });

  // Serve public assets
  const assets = sirv(path.join(cwd, 'public'), {
    maxAge: 31536000,
    immutable: true,
  });

  // Create HTTP server
  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    if (req.url === '/') {
      const message = appService.getMessage();
      res.setHeader('Content-Type', 'text/html');
      res.end(await engine.render('@/pages/home', { message }));
      return;
    }

    // Server-side render routes
    if (req.url === '/about') {
      res.setHeader('Content-Type', 'text/html');
      res.end(await engine.render('@/pages/about'));
      return;
    }

    assets(req, res);
    if (res.headersSent) return;

    res.statusCode = 404;
    res.end('404 Not Found');
  });

  server.listen(3000, () => {
    console.log('Server running at http://localhost:3000/');
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
