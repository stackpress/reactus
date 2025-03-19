//node
import path from 'node:path';
import { createServer } from 'node:http';
//modules
import tailwindcss from '@tailwindcss/vite';
//reactus
import reactus from 'reactus';

async function develop() {
  const cwd = process.cwd();
  const engine = reactus({
    cwd,
    vite: {
      server: { 
        middlewareMode: true,
        watch: { 
          ignored: [ '**/.build/**' ] 
        }
      },
      appType: 'custom',
      base: '/',
      root: cwd,
      mode: 'development',
      publicDir: path.join(cwd, 'public'),
      plugins: [ tailwindcss() ]
    },
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
    pagePath: path.join(cwd, '.build/pages'),
    //style route prefix used in the document markup
    //ie. /assets/[id][extname]
    //<link rel="stylesheet" type="text/css" href="/client/[id][extname]" />
    //<link rel="stylesheet" type="text/css" href="/assets/abc123.css" />
    styleRoute: '/assets'
  });

  const server = createServer(async (req, res) => {
    //handles public, assets and hmr
    await engine.http(req, res);
    //if middleware was triggered
    if (res.headersSent) return;
    // home page
    if (req.url === '/') {
      res.setHeader('Content-Type', 'text/html');
      res.end(await engine.getMarkup('@/pages/home', { title: 'Home' }));
      return;
    //about page
    } else if (req.url === '/about') {
      res.setHeader('Content-Type', 'text/html');
      res.end(await engine.getMarkup('@/pages/about'));
      return;
    } else if (req.url === '/contact') {
      res.setHeader('Content-Type', 'text/html');
      res.end(await engine.getMarkup('reactus-with-plugin/pages/contact'));
      return;
    } else if (req.url === '/how') {
      res.setHeader('Content-Type', 'text/html');
      res.end(await engine.getMarkup('reactus-with-plugin/pages/how'));
      return;
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

