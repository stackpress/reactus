//node
import { createServer } from 'node:http';
//modules
import UnoCSS from 'unocss/vite';
//reactus
import { dev } from 'reactus';

async function develop() {
  const cwd = process.cwd();
  const engine = dev({
    cwd,
    basePath: '/',
    plugins: [ UnoCSS() ],
    watchIgnore: [ '**/.build/**' ],
    //client script route prefix used in the document markup
    //ie. /client/[id][extname]
    //<script type="module" src="/client/[id][extname]"></script>
    //<script type="module" src="/client/abc123.tsx"></script>
    clientRoute: '/client',
    //filepath to a global css file
    cssFiles: [ 'reactus/fouc.css', 'virtual:uno.css' ]
  });

  const server = createServer(async (req, res) => {
    //handles public, assets and hmr
    await engine.http(req, res);
    //if middleware was triggered
    if (res.headersSent) return;
    // home page
    if (req.url === '/') {
      res.setHeader('Content-Type', 'text/html');
      res.end(await engine.render('@/pages/home', { title: 'Home' }));
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

