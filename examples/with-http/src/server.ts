//node
import type { IncomingMessage, ServerResponse } from 'node:http';
import { createServer } from 'node:http';
import path from 'node:path';
import fs from 'node:fs/promises';
//reactus
import { dev } from 'reactus';

export type IM = IncomingMessage;
export type SR = ServerResponse<IM>;

const cwd = path.dirname(import.meta.dirname);
const document = path.join(cwd, 'src', 'document.html');

const reactus = dev({
  clientPath: path.join(cwd, '.build/client'),
  documentPath: path.join(cwd, '.build/document'),
  documentTemplate: await fs.readFile(document, 'utf8'),
  vite: {
    server: { middlewareMode: true },
    appType: 'custom',
    base: '/',
    root: cwd,
    mode: 'development',
    publicDir: path.join(cwd, 'public'),
  }
});

const server = createServer(async (req, res) => {
  const resource = await reactus.engine.connection();
  //handles public assets and hmr
  await new Promise(r => resource.middlewares(req, res, r));
  if (res.headersSent) return;
  // home page
  if (req.url === '/') {
    res.setHeader('Content-Type', 'text/html');
    res.end(await reactus.document('@/src/pages/home.tsx'));
    return;
  //about page
  } else if (req.url === '/about') {
    res.setHeader('Content-Type', 'text/html');
    res.end(await reactus.document('@/src/pages/about.tsx'));
    return;
  //client scripts
  } else if (req.url && /^\/client\/[a-z0-9]+\.tsx$/.test(req.url)) {
    const buildId = req.url.slice(8, -4);
    const build = reactus.find(buildId);
    if (build) {
      const client = await build.client();
      if (client) {
        res.setHeader('Content-Type', 'text/javascript');
        res.end(client);
        return;
      }
    }
  }
  res.end('404 Not Found');
});

server.listen(3000, () => {
  console.log('Server running at http://localhost:3000/');
});

