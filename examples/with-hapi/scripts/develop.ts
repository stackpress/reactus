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

  //ResponseToolkit provides methods to generate responses from requests
  server.ext('onRequest', async (request: Request, ResponseToolkit: ResponseToolkit) => {
    await engine.http(request.raw.req, request.raw.res);
    if (request.raw.res.headersSent || request.raw.res.writableEnded) {
      return ResponseToolkit.abandon;
    }
    return ResponseToolkit.continue;
  });

  server.route({
    method: 'GET',
    path: '/',
    handler: async (_request: Request, ResponseToolkit: ResponseToolkit) => {
      const html = await engine.render('@/pages/home', { title: 'Home' });
      return ResponseToolkit.response(html).type('text/html');
    }
  });

  server.route({
    method: 'GET',
    path: '/about',
    handler: async (_request: Request, ResponseToolkit: ResponseToolkit) => {
      const html = await engine.render('@/pages/about');
      return ResponseToolkit.response(html).type('text/html');
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
