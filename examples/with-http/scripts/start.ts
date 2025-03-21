//node
import type { IncomingMessage, ServerResponse } from 'node:http';
import { createServer } from 'node:http';
import path from 'node:path';
import sirv from 'sirv';
//reactus
import { serve } from 'reactus';

export type IM = IncomingMessage;
export type SR = ServerResponse<IM>;

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
    //style route prefix used in the document markup
    //ie. /assets/[id][extname]
    //<link rel="stylesheet" type="text/css" href="/client/[id][extname]" />
    //<link rel="stylesheet" type="text/css" href="/assets/abc123.css" />
    styleRoute: '/assets'
  });
  // Init `sirv` handler
  const assets = sirv(path.join(cwd, 'public'), {
    maxAge: 31536000, // 1Y
    immutable: true
  });

  const server = createServer(async (req, res) => {
    // home page
    if (req.url === '/') {
      res.setHeader('Content-Type', 'text/html');
      res.end(await engine.render('@/pages/home'));
      return;
    //about page
    } else if (req.url === '/about') {
      res.setHeader('Content-Type', 'text/html');
      res.end(await engine.render('@/pages/about'));
      return;
    } else if (req.url === '/contact') {
      res.setHeader('Content-Type', 'text/html');
      res.end(await engine.render('reactus-with-plugin/pages/contact'));
      return;
    } else if (req.url === '/how') {
      res.setHeader('Content-Type', 'text/html');
      res.end(await engine.render('reactus-with-plugin/pages/how'));
      return;
    }
    //static asset server
    assets(req, res);
    //if static asset was triggered
    if (res.headersSent) return;
    res.end('404 Not Found');
  });

  server.listen(3000, () => {
    console.log('Server running at http://localhost:3000/');
  });
}

start().catch(e => {
  console.error(e);
  process.exit(1);
});

