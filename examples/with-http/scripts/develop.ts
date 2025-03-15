//node
import type { IncomingMessage, ServerResponse } from 'node:http';
import { createServer } from 'node:http';
import path from 'node:path';
import fs from 'node:fs/promises';
//reactus
import reactus from 'reactus';

export type IM = IncomingMessage;
export type SR = ServerResponse<IM>;

async function develop() {
  const cwd = process.cwd();
  const document = path.join(cwd, 'assets/document.html');

  const dev = reactus('development', {
    documentTemplate: await fs.readFile(document, 'utf8'),
    connect: async () => {
      const { createServer } = await import('vite');
      return await createServer( {
        server: { middlewareMode: true },
        appType: 'custom',
        base: '/',
        root: cwd,
        mode: 'development',
        publicDir: path.join(cwd, 'public'),
      });
    }
  });

  const resource = await dev.resource();
  if (!resource) {
    throw new Error('Failed to create resource');
  }

  const server = createServer(async (req, res) => {
    //handles public assets and hmr
    await new Promise(r => resource.middlewares(req, res, r));
    //if middleware was triggered
    if (res.headersSent) return;
    // home page
    if (req.url === '/') {
      res.setHeader('Content-Type', 'text/html');
      res.end(await dev.getMarkup('@/pages/home'));
      return;
    //about page
    } else if (req.url === '/about') {
      res.setHeader('Content-Type', 'text/html');
      res.end(await dev.getMarkup('@/pages/about'));
      return;
    //client scripts
    } else if (req.url && /^\/client\/[a-z0-9]+\.tsx$/.test(req.url)) {
      const id = req.url.slice(8, -4);
      const page = dev.find(id);
      if (page) {
        const client = await page.getClientBuild();
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
}

develop().catch(e => {
  console.error(e);
  process.exit(1);
});

