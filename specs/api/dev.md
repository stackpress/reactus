# `dev()`

Create a Reactus development engine with Vite middleware and hot reload support.

```ts
import { dev } from 'reactus';

const engine = dev({
  cwd: process.cwd(),
  basePath: '/',
  clientRoute: '/client'
});
```

Use `dev()` when you want to:

- render pages directly from source files
- run Vite middleware through your server
- use React fast refresh and Vite transforms during development

## Common properties

The returned object exposes:

| Property | Description |
| --- | --- |
| `config` | Final merged configuration. |
| `paths` | Built path settings from the underlying `Server`. |
| `routes` | Route prefixes such as the client route. |
| `templates` | Active client, document, and page templates. |
| `viteConfig` | Original Vite config passed into `ServerResource`. |
| `size` | Current manifest size. |
| `server` | The underlying `Server` instance. |

## Common methods

### `http(req, res)`

Pass a request through Vite and Reactus middleware.

```ts
await engine.http(req, res);
if (res.headersSent) return;
```

Use this before your own route handling.

### `render(entry, props?)`

Render a page entry to final HTML.

```ts
const html = await engine.render('@/pages/home', { title: 'Home' });
```

### `set(entry)`

Add an entry to the manifest and return its `Document`.

```ts
const document = await engine.set('@/pages/home');
```

### `renderHMR(entry)`

Return the transformed HMR client module for a page entry.

```ts
const code = await engine.renderHMR('@/pages/home');
```

### `absolute(entry)` and `id(entry)`

Resolve a page entry to its absolute source path or generated document id.

## Related

- [Development server guide](../guides/development-server.md)
- [Server](./Server.md)
- [DocumentRender](./DocumentRender.md)
