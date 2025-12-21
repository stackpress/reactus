import restify from 'restify';
import { dev } from 'reactus';


async function develop() {
  const engine = dev({
    cwd: process.cwd(),
    basePath: '/',
    clientRoute: '/client'
  });

  const server = restify.createServer();

  //middleware to handle public, assets, and hmr
  server.pre(async (req, res) => {
      await engine.http(req, res);

      if (res.headersSent) {
        return; 
      }
      return; 
  });
  
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

develop().catch((e) => {
  console.error(e);
  process.exit(1);
});
