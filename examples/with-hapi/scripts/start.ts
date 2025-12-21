//node
import path from 'node:path';
//modules
import type { Request, ResponseToolkit } from '@hapi/hapi';
import Hapi from '@hapi/hapi';
import Inert from '@hapi/inert';
import { serve } from 'reactus'; 

async function start() {
  const cwd = process.cwd();
  const engine = serve({
    cwd,
    // ie. /client/[id][extname]
    // <script type="module" src="/client/[id][extname]"></script>
    // <script type="module" src="/client/abc123.tsx"></script>
    clientRoute: '/client',
    // path where to load the server script (js)
    pagePath: path.join(cwd, '.build/pages'), // Adjust if build output differs
    // css route prefix used in the document markup
    // ie. /assets/[id][extname]
    // <link rel="stylesheet" type="text/css" href="/client/[id][extname]" />
    // <link rel="stylesheet" type="text/css" href="/assets/abc123.css" />
    cssRoute: '/assets'
  });

  const server = Hapi.server({
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost'
  });

  await server.register(Inert);

  server.route({
    method: 'GET',
    path: '/{param*}', 
    handler: {
      directory: {
        path: path.join(cwd, 'public'), 
        redirectToSlash: true,
        index: false
      }
    }
  });

  server.route({
    method: 'GET',
    path: '/',
    handler: async (_request: Request, ResponseToolkit: ResponseToolkit) => {
      try {
        // Render the home page using Reactus engine
        const html = await engine.render('@/pages/home', { title: 'Home' });
        return ResponseToolkit.response(html).type('text/html');
      } catch (error) {
        console.error("SSR Error /:", error);
        return ResponseToolkit.response('Server Error').code(500);
      }
    }
  });

  server.route({
    method: 'GET',
    path: '/about',
    handler: async (_request: Request, ResponseToolkit: ResponseToolkit) => {
      try {
        // Render the about page using Reactus engine
        const html = await engine.render('@/pages/about');
        return ResponseToolkit.response(html).type('text/html');
      } catch (error) {
        console.error("SSR Error /about:", error);
        return ResponseToolkit.response('Server Error').code(500);
      }
    }
  });

  server.route({
    method: '*', 
    path: '/{any*}', 
    handler: (request: Request, ResponseToolkit: ResponseToolkit) => {
      console.log(`404 Not Found: ${request.method.toUpperCase()} ${request.path}`);
      // Return a simple text response with a 404 status code
      return ResponseToolkit.response('Page not found').code(404).type('text/plain');
    }
  });

  try {
    await server.start();
    console.log(`Server running at: ${server.info.uri}`);
  } catch (err) {
    console.error('Error starting Hapi production server:', err);
    process.exit(1);
  }
}
    
start()
