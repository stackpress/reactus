import { dev } from 'reactus';
import Koa from 'koa';
import Router from '@koa/router';


async function develop() {
  const engine = dev({
    cwd: process.cwd(),
    basePath: '/',
    clientRoute: '/client',
  })

  const app = new Koa();
  const router = new Router();

  // Handle reactus http requests (public, assets, and hmr)
  app.use(async (ctx, next) => {
    await engine.http(ctx.req, ctx.res);

    if (ctx.res.headersSent) return;
    await next(); 
  });

  router.get('/', async (ctx) => {
    ctx.set('Content-Type', 'text/html');
    ctx.body = await engine.render('@/pages/home', { title: 'Home' });
    return;
  });

  router.get('/about', async (ctx) => {
    ctx.set('Content-Type', 'text/html');
    ctx.body = await engine.render('@/pages/about');
    return;
  });

  app.use(router.routes()).use(router.allowedMethods());

  // Catch-all middleware for 404
  app.use(async (ctx) => {
    if (!ctx.body) {
        ctx.status = 404;
        ctx.body = '404 not found.';
    }
  });

  app.listen(3000, () => {
    console.log('Server listening at http://localhost:3000');
  });
}

develop().catch(e => {
  console.error(e);
  process.exit(1);
});