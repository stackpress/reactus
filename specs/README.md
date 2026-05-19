# Reactus

Reactus is a reactive template engine for server-rendered "mini-apps". It renders React components with server-side props, uses Vite for development and builds, and leaves your HTTP server, routes, and application architecture in your hands.

Use Reactus when you want:

- server-rendered React without standing up a separate frontend app
- client hydration for interactive pages
- Vite plugins and React fast refresh in development
- low level engine access and total control of the build step

Reactus does not give you:

- a client-side router
- a data layer or state architecture
- an opinionated full-stack framework
- React server components

Reactus is the template engine for server frameworks.

- ExpressJS
- Fastify
- Hapi
- Koa
- NestJS
- Restify

## Start here

- [Getting started](./getting-started.md): build one page, render it on the server, and verify hydration works.
- [Mental model](./explanation/mental-model.md): understand how documents, manifests, builds, and runtime rendering fit together.
- [Development server guide](./guides/development-server.md): use `dev()` with `node:http` or another server.
- [Build and serve guide](./guides/build-and-serve.md): prebuild assets and page modules for production.
- [Framework integration guide](./guides/framework-integration.md): wire Reactus into Express, Fastify, or similar servers.
- [CSS frameworks guide](./guides/css-frameworks.md): add global CSS, Tailwind, or UnoCSS.
- [API reference](./api/README.md): look up config types, wrapper APIs, and lower-level classes.

## Who this is for

Reactus is a good fit for teams that want React rendering without adopting a full framework. You keep your existing Node server, define routes yourself, and pass props directly into page components.

## Recommended path

1. Finish [Getting started](./getting-started.md).
2. Read [Mental model](./explanation/mental-model.md).
3. Pick the guide that matches your next task.
4. Use the [API reference](./api/README.md) as lookup material.
