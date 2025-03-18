//node
import type { IncomingMessage, ServerResponse } from 'node:http';
import { createServer } from 'node:http';
import path from 'node:path';
import sirv from 'sirv';
//reactus
import reactus from 'reactus';

export type IM = IncomingMessage;
export type SR = ServerResponse<IM>;

async function start() {
  const cwd = process.cwd();
  const engine = reactus({
    cwd,
    //path where to save assets (css, images, etc)
    assetPath: path.join(cwd, 'public/assets'),
    //path where to save and load (live) the client scripts (js)
    clientPath: path.join(cwd, 'public/client'),
    //client script route prefix used in the document markup
    //ie. /client/[id][extname]
    //<script type="module" src="/client/[id][extname]"></script>
    //<script type="module" src="/client/abc123.tsx"></script>
    clientRoute: '/client',
    //path where to save and load (live) the server script (js)
    pagePath: path.join(cwd, '.build/pages')
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
      res.end(await engine.getMarkup('@/pages/home'));
      return;
    //about page
    } else if (req.url === '/about') {
      res.setHeader('Content-Type', 'text/html');
      res.end(await engine.getMarkup('@/pages/about'));
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

