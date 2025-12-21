//fastify
import Fastify from 'fastify';
//reactus
import { dev } from 'reactus';

async function develop() {
  const cwd = process.cwd();
  const engine = dev({
    cwd,
    basePath: '/',
    watchIgnore: ['**/.build/**'],
    clientRoute: '/client',
  });

  const server = Fastify();
  server.addHook('onRequest', async (request, reply) => {
    // handles public, assets and hmr
    await engine.http(request.raw, reply.raw);
    // if middleware was triggered
    if (reply.sent) return reply;
  });

  server.get('/', async (_, reply) => {
    reply.header('Content-Type', 'text/html');
    reply.send(await engine.render('@/pages/home', { title: 'Home' }));
  });

  server.get('/about', async (_, reply) => {
    reply.header('Content-Type', 'text/html');
    reply.send(await engine.render('@/pages/about'));
  });

  server.setNotFoundHandler((_, reply) => {
    reply.code(404).send('Page not found');
  });

  server.listen({ port: 3000 }, (err, _) => {
    if (err) {
      console.log(err);
      process.exit(1);
    }
    console.log('Server running at http://localhost:3000/');
  });
}

develop();
