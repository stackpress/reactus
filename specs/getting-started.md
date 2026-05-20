# Getting Started

This tutorial gets you from an empty folder to a working Reactus page rendered by `node:http`.

By the end, you will:

- render one React page on the server
- pass props from the server into the page
- let React hydrate the page in the browser

## Before you start

You need:

- Node.js
- React
- React DOM
- Vite
- `@vitejs/plugin-react`
- TypeScript or TSX runtime tooling if you want to run `.ts` scripts directly

One install path is:

```bash
npm install react react-dom reactus vite @vitejs/plugin-react
npm install -D typescript tsx @types/node @types/react @types/react-dom
```

## 1. Create a page

Create `pages/home.tsx`.

```tsx
import { useState } from 'react';

export function Head() {
  return <title>Reactus</title>;
}

export default function HomePage({ title }: { title: string }) {
  const [count, setCount] = useState(0);

  return (
    <main>
      <h1>{title}</h1>
      <p>Rendered by Reactus.</p>
      <button onClick={() => setCount(count + 1)}>
        Count: {count}
      </button>
    </main>
  );
}
```

## 2. Create a development server

Create `scripts/develop.ts`.

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

    if (req.url === '/') {
      res.setHeader('Content-Type', 'text/html');
      res.end(await engine.render('@/pages/home', { title: 'Hello Reactus' }));
      return;
    }

    res.statusCode = 404;
    res.end('404 Not Found');
  });

  server.listen(3000, () => {
    console.log('Server running at http://localhost:3000/');
  });
}

develop().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

## 3. Run the server

```bash
npx tsx scripts/develop.ts
```

Open `http://localhost:3000/`.

## 4. Verify success

You should see:

- the page title from `Head()`
- the `Hello Reactus` heading
- a button that increments after hydration

If the button works, server rendering and client hydration are both active.

## What just happened

- `dev()` created a development engine around Vite and React fast refresh.
- `engine.http(req, res)` handled Vite middleware, assets, and HMR requests.
- `engine.render(entry, props)` resolved `@/pages/home`, rendered it on the server, and injected the client entry used for hydration.
- Your page stayed a normal React component. Reactus did not create a router or data layer for you.

## Next steps

- Read [Mental model](./explanation/mental-model.md) to understand the moving parts.
- Read [Development server guide](./guides/development-server.md) to add more routes or switch to Express.
- Read [Build and serve guide](./guides/build-and-serve.md) when you are ready for production.
- Use the [API reference](./api/README.md) when you need exact method details.
