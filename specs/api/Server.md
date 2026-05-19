# Server

`Server` is the shared runtime object behind Reactus rendering. It stores configuration, manifest state, template strings, and the Vite bridge used during development.

```ts
import { Server } from 'reactus';

const server = new Server(Server.configure({
  cwd: process.cwd(),
  production: false
}));
```

## Static method

### `Server.configure(options)`

Merge partial options with Reactus defaults.

```ts
const config = Server.configure({
  cwd: process.cwd(),
  clientRoute: '/client'
});
```

**Returns**

A frozen `ServerConfig` object.

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `loader` | `ServerLoader` | File and module loader. |
| `manifest` | `ServerManifest` | Collection of known document entries. |
| `resource` | `ServerResource` | Vite integration. |
| `production` | `boolean` | Rendering mode flag. |
| `vfs` | `VirtualServer` | In-memory file store used during builds and transforms. |
| `paths` | frozen object | Asset, client, page, and optional CSS paths. |
| `routes` | frozen object | Client and CSS route prefixes. |
| `templates` | frozen object | Client, document, and page templates. |

## Method

### `http(req, res)`

Run the Vite middleware stack for a request.

```ts
await server.http(req, res);
```

Use this in development before your own route logic.

## Related

- [ServerLoader](./ServerLoader.md)
- [ServerManifest](./ServerManifest.md)
- [ServerResource](./ServerResource.md)
