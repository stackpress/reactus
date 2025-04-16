import path from "node:path";
import { serve } from "reactus";
import express from 'express';

import sirv from "sirv";

async function start() {
  const app = express();
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

    //middleware using sirv to handle public assets
    app.use(assets);

  app.get('/', async (_req, res) => {
    try {
      res.setHeader('Content-Type', 'text/html');
      res.send(await engine.render('@/pages/home'));
      return;
    } catch (error) {
      console.error('Error rendering /home:', error);
      res.status(500).send('Internal Server Error');
    }
  });

  app.get('/about', async (_req, res) => {
    try {
      res.setHeader('Content-Type', 'text/html');
      res.send(await engine.render('@/pages/about'));
      return;
    } catch (error) {
      console.error('Error rendering /about:', error);
      res.status(500).send('Internal Server Error');
    }
  });

  app.use((_req, res) => {
    res.status(404).send('Not Found.');
  });

  app.listen(3000,() => {
    console.log(`Server listening at http://localhost:3000`);
  });
}

start().catch(e => {
  console.error(e);
  process.exit(1);
});