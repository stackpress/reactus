import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { dev } from 'reactus';
import { createServer, IncomingMessage, ServerResponse } from 'http';

async function develop() { 
  // Create NestJS app without body parsing
  const app = await NestFactory.create(AppModule, {
    bodyParser: false, 
  });
  await app.init();

  // Set up Reactus dev server
  const engine = dev({
    cwd: process.cwd(),
    basePath: '/',
    watchIgnore: ['**/.build/**'],
    clientRoute: '/client',
  });

  // Handle HTTP requests
  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    await engine.http(req, res);
    if (res.headersSent) return;

    // Server-side render routes
    if (req.url === '/') {
      res.setHeader('Content-Type', 'text/html');
      res.end(await engine.render('@/pages/home', { title: 'Home' }));
      return;
    }

    if (req.url === '/about') {
      res.setHeader('Content-Type', 'text/html');
      res.end(await engine.render('@/pages/about'));
      return;
    }

    res.statusCode = 404;
    res.end('404 Not Found');
  });

  server.listen(3000, () => {
    console.log('Server running at http://localhost:3000');
  });
}

develop().catch(err => {
  console.error(err);
  process.exit(1);
});
