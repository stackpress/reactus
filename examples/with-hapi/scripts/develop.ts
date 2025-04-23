import Hapi from '@hapi/hapi';
import type { Request, ResponseToolkit } from '@hapi/hapi';
import { dev } from 'reactus';

async function develop() {
  const cwd = process.cwd();
  const engine = dev({
    cwd,
    basePath: '/',
    watchIgnore: ['**/.build/**'],
    clientRoute: '/client',
  });

  const server = Hapi.server({
    port: process.env.PORT || 3000,
    host: 'localhost',
  });

  server.ext('onRequest', async (request: Request, h: ResponseToolkit) => {
    await engine.http(request.raw.req, request.raw.res);
    if (request.raw.res.headersSent || request.raw.res.writableEnded) {
      return h.abandon;
    }
    return h.continue;
  });

  server.route({
    method: 'GET',
    path: '/',
    handler: async (_request: Request, h: ResponseToolkit) => {
      const html = await engine.render('@/pages/home', { title: 'Home' });
      return h.response(html).type('text/html');
    }
  });

  server.route({
    method: 'GET',
    path: '/about',
    handler: async (_request: Request, h: ResponseToolkit) => {
      const html = await engine.render('@/pages/about');
      return h.response(html).type('text/html');
    }
  });

  try {
    await server.start();
    console.log(`Server running at: ${server.info.uri}`);
  } catch (err) {
    console.error('Error starting Hapi server:', err);
    process.exit(1);
  }

}

develop();
