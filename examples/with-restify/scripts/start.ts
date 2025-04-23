import path from "node:path";
import { serve } from "reactus";
import restify from 'restify';

import sirv from "sirv";

async function start() {
  const server = restify.createServer();
  const cwd = process.cwd();
  
  const engine = serve({
    cwd,
    clientRoute: '/client',
    pagePath: path.join(cwd, '.build/pages'),
    cssRoute: '/assets'
  });

  const assets = sirv(path.join(cwd, 'public'), {
    maxAge: 31536000,
    immutable: true,
  });

    //middleware to use sirv to handle public assets
    server.pre(assets);

    server.get('/', async (_req, res) => {
      res.setHeader('Content-Type', 'text/html');
      res.end(await engine.render('@/pages/home', { title: 'Home' }));
    });

    server.get('/about', async (_req, res) => {
      res.setHeader('Content-Type', 'text/html');
      res.end(await engine.render('@/pages/about', {title: 'About' }));
    });
  
  //catch-all route
  server.on('NotFound', (_req, res, _err, cb) => {
    res.send(404, '404 Not Found');
    return cb();
  });

  server.listen(3000, () => {
    console.log('Server listening at http://localhost:3000');
  });
}

start().catch(e => {
  console.error(e);
  process.exit(1);
});