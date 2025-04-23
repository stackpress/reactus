//node
import path from 'node:path';
import Koa from 'koa';          // Import Koa
import serveStatic from 'koa-static'; // Import koa-static
//reactus
import { serve } from 'reactus';

async function start() {
  const cwd = process.cwd();
  const engine = serve({
    cwd,
    clientRoute: '/client',
    pagePath: path.join(cwd, '.build/pages'),
    cssRoute: '/assets'
  });

  const app = new Koa(); // Create a Koa app instance

  // Serve static files from 'public' directory using koa-static
  app.use(serveStatic(path.join(cwd, 'public'), {
    maxage: 31536000 * 1000, // 1Y in milliseconds
    immutable: true
  }));

  // Koa Middleware for page rendering
  app.use(async (ctx, next) => {
    // Routing logic using ctx.path
    if (ctx.path === '/') {
      ctx.type = 'text/html'; // Set content type
      ctx.body = await engine.render('@/pages/home'); // Set response body
    } else if (ctx.path === '/about') {
      ctx.type = 'text/html';
      ctx.body = await engine.render('@/pages/about');
    } else {
      // If it's not a page route, and wasn't handled by static middleware,
      // Koa will automatically send a 404 Not Found if ctx.body remains unset.
      await next();
    }
  });

  app.listen(3000, () => { // Use app.listen
    console.log('Server running at http://localhost:3000/');
  });
}

start().catch(e => {
  console.error(e);
  process.exit(1);
});