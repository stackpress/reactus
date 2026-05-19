# Framework Integration

Use this guide when you want to mount Reactus inside an existing Node web server.

The pattern is always the same:

1. create a Reactus engine
2. hand requests to Reactus middleware first
3. render a page entry from your framework route

## Express

```ts
import express from 'express';
import { dev } from 'reactus';

async function develop() {
  const engine = dev({
    cwd: process.cwd(),
    basePath: '/',
    clientRoute: '/client'
  });

  const app = express();

  app.use(async (req, res, next) => {
    await engine.http(req, res);
    if (res.headersSent) return;
    next();
  });

  app.get('/', async (_req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.end(await engine.render('@/pages/home', { title: 'Home' }));
  });
}
```

## Fastify

Use the same shape. The only difference is the framework response API.

```ts
import Fastify from 'fastify';
import { dev } from 'reactus';

async function develop() {
  const engine = dev({
    cwd: process.cwd(),
    basePath: '/',
    clientRoute: '/client'
  });

  const app = Fastify();

  app.addHook('onRequest', async (req, reply) => {
    await engine.http(req.raw, reply.raw);
    if (reply.raw.headersSent) return reply;
  });

  app.get('/', async (_req, reply) => {
    reply.header('Content-Type', 'text/html');
    return await engine.render('@/pages/home', { title: 'Home' });
  });
}
```

## What your framework still owns

Reactus does not replace your server framework.

Your framework still owns:

- route matching
- request validation
- sessions and auth
- APIs
- static file policy in production

## Existing framework apps

The examples also reinforce one practical split:

- in development, pass requests through `engine.http(req, res)` so Vite and Reactus can handle transformed modules and HMR
- in production, serve built static files with your framework or a static file helper, then call `render()` for page routes

That pattern works the same whether the host framework is minimal `node:http`, Express, Fastify, Hapi, Koa, Restify, or a larger app shell such as Nest.

## When to use `node:http` instead

Use bare `node:http` when:

- you want the smallest possible setup
- your app only needs a few routes
- you do not need framework middleware

Use Express, Fastify, or another server when you already have one or need its routing and middleware ecosystem.
