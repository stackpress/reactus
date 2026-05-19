# SPA-Style Routing

Use this guide when you want Reactus to server-render one app shell and let a client-side router handle navigation after hydration.

This is a valid way to use Reactus, but it is not the main path the library optimizes for. If your goal is purely an SPA, there are many libraries and frameworks built specifically for that model.

Reactus is still useful here when you want:

- one server-rendered first load
- client hydration into a router app
- to keep your own Node server and route boundaries

Reactus does not provide the router. You bring your own client-side routing library, such as React Router.

## When this pattern makes sense

Choose this pattern when:

- you want SSR for the first request
- most navigation after load should stay client-side
- you already know you want a router library in the browser

Do not choose it just because it is possible. If a normal server-rendered multi-page setup is enough, the simpler Reactus flow is easier to reason about.

## How it works

The idea is simple:

1. create one Reactus page entry that acts as your app shell
2. render that same entry for every non-asset, non-API page request
3. pass the current request URL into the page props
4. use a server router on the server render and a browser router after hydration

Reactus handles:

- rendering the app shell to HTML
- serializing props into the page
- hydrating the page in the browser

You still own:

- route definitions
- navigation behavior
- route-level data loading strategy
- which URLs should bypass the app shell

## Example with React Router

Install React Router:

```bash
npm install react-router-dom
```

Create `pages/app.tsx`:

```tsx
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { StaticRouter } from 'react-router-dom/server';

type AppPageProps = {
  path?: string;
};

function AppRoutes() {
  return (
    <>
      <nav>
        <Link to="/">Home</Link> | <Link to="/about">About</Link>
      </nav>
      <Routes>
        <Route path="/" element={<h1>Home</h1>} />
        <Route path="/about" element={<h1>About</h1>} />
      </Routes>
    </>
  );
}

export function Head() {
  return <title>Reactus SPA Shell</title>;
}

export default function AppPage({ path = '/' }: AppPageProps) {
  if (typeof window === 'undefined') {
    return (
      <StaticRouter location={path}>
        <AppRoutes />
      </StaticRouter>
    );
  }

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
```

## Development server

Render the same entry for every page request that should live inside the SPA shell.

```ts
import { createServer } from 'node:http';
import { dev } from 'reactus';

async function develop() {
  const engine = dev({
    cwd: process.cwd(),
    basePath: '/',
    clientRoute: '/client'
  });

  const server = createServer(async (req, res) => {
    await engine.http(req, res);
    if (res.headersSent) return;

    const url = req.url || '/';

    if (url.startsWith('/api/') || url.startsWith('/client/') || url.startsWith('/assets/')) {
      res.statusCode = 404;
      res.end('Not Found');
      return;
    }

    res.setHeader('Content-Type', 'text/html');
    res.end(await engine.render('@/pages/app', { path: url }));
  });

  server.listen(3000);
}

develop().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

## Production shape

The production pattern is the same:

1. build the app shell entry with `build()`
2. serve your static assets
3. render the same `@/pages/app` entry for matching page requests with `serve()`

The only important difference is that production rendering uses the built page module from disk.

## What to watch out for

### Keep the first render consistent

The server router and browser router must produce the same initial markup for the same URL. If they do not, hydration will mismatch.

### Exclude non-page routes

Your catch-all should not swallow:

- API endpoints
- asset URLs
- health checks
- framework-specific internal routes

### Own your route data model

Reactus passes props into the app shell, but it does not define a route loader system. You need to decide how route-level data is fetched on the server and after client navigation.

### Be honest about tradeoffs

This setup gives you SSR plus client-side routing, but it also moves you toward problems that SPA-focused tools already solve. Use it when that tradeoff is intentional.

## When to use a different tool

If your application is primarily a browser-routed SPA and you want:

- route-level data APIs
- nested layouts with router conventions
- navigation-aware loading behavior
- a fuller client-router runtime

then a dedicated SPA or full-stack React framework may be a better fit.

## Related

- [Getting started](../getting-started.md)
- [Mental model](../explanation/mental-model.md)
- [Development server](./development-server.md)
- [Build and serve](./build-and-serve.md)
