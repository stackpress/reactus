# Builder

`Builder` extends `Server` and adds the disk-writing build methods used for production preparation.

```ts
import { Builder, Server } from 'reactus';

const builder = new Builder(Server.configure({
  cwd: process.cwd(),
  production: false
}));
```

Most application code should use the higher-level [build()](./build.md) wrapper instead of instantiating `Builder` directly.

## Inherited properties

`Builder` inherits the runtime properties from `Server`, including:

- `loader`
- `manifest`
- `resource`
- `vfs`
- `paths`
- `routes`
- `templates`

## Methods

### `buildAssets()`

Build and write asset files for every manifest entry.

```ts
const results = await builder.buildAssets();
```

**Returns**

An array of build status objects. Each successful result includes the entry id, entry path, generated contents, and destination file.

### `buildClients()`

Build and write the client hydration entry for every manifest entry.

```ts
const results = await builder.buildClients();
```

### `buildPages()`

Build and write the server page module for every manifest entry.

```ts
const results = await builder.buildPages();
```

## Related

- [build()](./build.md)
- [DocumentBuilder](./DocumentBuilder.md)
- [ServerManifest](./ServerManifest.md)
