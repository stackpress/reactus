//node
import Koa from 'koa'; // Import Koa
//reactus
import { dev } from 'reactus';

async function develop() {
  const cwd = process.cwd();
  const engine = dev({
    cwd,
    basePath: '/',
    watchIgnore: ['**/.build/**'],
    clientRoute: '/client'
  });

  const app = new Koa(); // Create a Koa app instance

  // Koa Middleware
  app.use(async (ctx, next) => {
    // Let reactus handle its development routes (client scripts, HMR, etc.)
    // Pass Koa's raw req/res objects to the engine's http handler
    await engine.http(ctx.req, ctx.res);

    // If reactus handled the request and sent a response, move to the next middleware (or end)
    if (ctx.res.headersSent) {
      return next();
    }

    // Routing logic using ctx.path
    if (ctx.path === '/') {
      ctx.type = 'text/html'; // Set content type using ctx.type
      ctx.body = await engine.render('@/pages/home', { title: 'Home' }); // Set response body using ctx.body
    } else if (ctx.path === '/about') {
      ctx.type = 'text/html';
      ctx.body = await engine.render('@/pages/about');
    } else {
      // Let Koa handle the 404 if no route matches
      await next();
    }
  });

  app.listen(3000, () => { // Use app.listen
    console.log('Server running at http://localhost:3000/');
  });
}

develop().catch(e => {
  console.error(e);
  process.exit(1);
});