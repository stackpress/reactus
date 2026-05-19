# Development Server

Use this guide when you want to run Reactus in development mode and add page routes to your server.

## Use `dev()` with `node:http`

This is the smallest working pattern.

```ts
import { createServer } from 'node:http';
import { dev } from 'reactus';

async function develop() {
  const engine = dev({
    cwd: process.cwd(),
    basePath: '/',
    clientRoute: '/client',
    watchIgnore: ['**/.build/**']
  });

  const server = createServer(async (req, res) => {
    await engine.http(req, res);
    if (res.headersSent) return;

    if (req.url === '/') {
      res.setHeader('Content-Type', 'text/html');
      res.end(await engine.render('@/pages/home', { title: 'Home' }));
      return;
    }

    res.statusCode = 404;
    res.end('404 Not Found');
  });

  server.listen(3000);
}
```

## Why `engine.http()` comes first

`engine.http(req, res)` gives Vite a chance to handle:

- HMR requests
- transformed module requests
- virtual files used by Reactus

Always call it before your route logic.

## Add more routes

You can keep using your own routing style.

```ts
if (req.url === '/about') {
  res.setHeader('Content-Type', 'text/html');
  res.end(await engine.render('@/pages/about'));
  return;
}
```

Reactus does not create a client-side router for you. Your server decides which entry to render.

## Render a page from another package or workspace

Reactus entries do not have to come only from your app root.

If a page lives in another workspace package, you can render it by package-style path:

```ts
if (req.url === '/contact') {
  res.setHeader('Content-Type', 'text/html');
  res.end(await engine.render('reactus-with-plugin/pages/contact'));
  return;
}
```

This is useful when you want to share Reactus pages across workspaces or publish reusable page packages.

## Pass props from the server

`render()` accepts a props object that becomes the page component props.

```ts
res.end(await engine.render('@/pages/home', {
  title: 'Dashboard',
  user: { name: 'Ada' }
}));
```

## Add global CSS

Use `cssFiles` when every page should include the same stylesheet.

```ts
const engine = dev({
  cwd: process.cwd(),
  basePath: '/',
  clientRoute: '/client',
  cssFiles: ['public/global.css']
});
```

## Support built CSS in `Head()`

If your page exports `Head()`, Reactus can pass built stylesheet URLs to it in production.

That lets the page decide where those `<link>` tags should go:

```tsx
export function Head({ styles = [] }: { styles?: string[] }) {
  return (
    <>
      <title>Contact</title>
      {styles.map((href, index) => (
        <link key={index} rel="stylesheet" href={href} />
      ))}
    </>
  );
}
```

In development, Reactus handles Vite's stylesheet flow for you. In production, this pattern is useful when a built page emits CSS files that need to be linked from the head.

## Add Vite plugins

Use the `plugins` option to bring in Vite-compatible tooling.

```ts
import UnoCSS from 'unocss/vite';

const engine = dev({
  cwd: process.cwd(),
  basePath: '/',
  clientRoute: '/client',
  plugins: [UnoCSS()],
  cssFiles: ['reactus/fouc.css', 'virtual:uno.css']
});
```

## Next steps

- Read [Framework integration](./framework-integration.md) if you use Express or Fastify.
- Read [CSS frameworks](./css-frameworks.md) for Tailwind or UnoCSS setup.
- Read [API reference for `dev()`](../api/dev.md) for the full wrapper surface.
