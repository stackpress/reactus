import { dev } from "reactus";
import express from 'express';


async function develop() {
  const engine = dev({ 
    cwd: process.cwd(),
    basePath: '/',
    clientRoute: '/client',
  })

  const app = express();

  //handle public, assets, and hmr
  app.use(async (req, res, next) => {
    await engine.http(req,res);

    if(res.headersSent) return;
    next();
  });

  app.get('/', async (_req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.end(await engine.render('@/pages/home', { title: 'Home' }));
    return;
  })

  app.get('/about', async (_req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.end(await engine.render('@/pages/about'));
    return;
  })

  //catch-all route
  app.use((_req, res) => {
    res.status(404).send('404 not found.');
  });

  app.listen(3000, () => {
    console.log(`Server listening at http://localhost:3000`);
  });
}

develop().catch(e => {
  console.error(e);
  process.exit(1);
});