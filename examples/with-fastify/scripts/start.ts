//node
import path from 'node:path';
import sirv from 'sirv';
//reactus
import { serve } from 'reactus';
//fastify
import Fastify from 'fastify';

async function start() {
  const cwd = process.cwd();
  const engine = serve({
    cwd,
    //ie. /client/[id][extname]
    //<script type="module" src="/client/[id][extname]"></script>
    //<script type="module" src="/client/abc123.tsx"></script>
    clientRoute: '/client',
    //path where to load the server script (js)
    pagePath: path.join(cwd, '.build/pages'),
    //css route prefix used in the document markup
    //ie. /assets/[id][extname]
    //<link rel="stylesheet" type="text/css" href="/client/[id][extname]" />
    //<link rel="stylesheet" type="text/css" href="/assets/abc123.css" />
    cssRoute: '/assets',
  });
  // Init `sirv` handler
  const assets = sirv(path.join(cwd, 'public'), {
    maxAge: 31536000, // 1Y
    immutable: true,
  });

  const server = Fastify();

  server.addHook('onRequest', async (req, reply) => {
    //static asset server
    await new Promise((resolve) => {
      assets(req.raw, reply.raw, () => {
        resolve(null);
      });
    });

    //if static asset was triggered
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

start();
