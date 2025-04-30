import path from "node:path";
import { serve } from "reactus";
import Koa from 'koa';
import Router from '@koa/router';
import koaStatic from 'koa-static';

async function start() {
  const app = new Koa();
  const router = new Router();
  const cwd = process.cwd();

  const engine = serve({
    cwd,
    clientRoute: '/client',
    pagePath: path.join(cwd, '.build/pages'),
    cssRoute: '/assets'
  });

  const assets = koaStatic(path.join(cwd, 'public'), {
    maxage: 31536000, // Equivalent to maxAge
    immutable: true,
  });

  // Middleware using koa-static to handle public assets
  app.use(assets);

  router.get('/', async (ctx) => {
    try {
      ctx.set('Content-Type', 'text/html');
      ctx.body = await engine.render('@/pages/home');
    } catch (error) {
      console.error('Error rendering /home:', error);
      ctx.status = 500;
      ctx.body = 'Internal Server Error';
    }
  });

  router.get('/about', async (ctx) => {
    try {
      ctx.set('Content-Type', 'text/html');
      ctx.body = await engine.render('@/pages/about');
    } catch (error) {
      console.error('Error rendering /about:', error);
      ctx.status = 500;
      ctx.body = 'Internal Server Error';
    }
  });

   app.use(router.routes()).use(router.allowedMethods());

  // Catch-all middleware for 404
  app.use(async (ctx) => {
    if (!ctx.body) {
      ctx.status = 404;
      ctx.body = 'Not Found.';
    }
  });


  app.listen(3000,() => {
    console.log(`Server listening at http://localhost:3000`);
  });
}

start().catch(e => {
  console.error(e);
  process.exit(1);
});