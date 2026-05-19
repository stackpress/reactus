# `build()`

Create a Reactus build engine for generating assets, client entries, and page modules.

```ts
import path from 'node:path';
import { build } from 'reactus';

const cwd = process.cwd();

const engine = build({
  cwd,
  assetPath: path.join(cwd, 'public/assets'),
  clientPath: path.join(cwd, 'public/client'),
  pagePath: path.join(cwd, '.build/pages')
});
```

## Common properties

| Property | Description |
| --- | --- |
| `config` | Final merged configuration. |
| `paths` | Output paths for assets, clients, and pages. |
| `production` | Mirrors the underlying builder mode. |
| `routes` | Route prefixes inherited from `Server`. |
| `templates` | Active template strings. |
| `viteConfig` | Original Vite config. |
| `size` | Current manifest size. |
| `builder` | The underlying `Builder` instance. |

## Build-all methods

### `buildAllAssets()`

Build and write asset files for every manifest entry.

### `buildAllClients()`

Build and write client hydration entries for every manifest entry.

### `buildAllPages()`

Build and write server page modules for every manifest entry.

Each returns an array of build status objects.

## Per-entry methods

### `set(entry)`

Register a page entry in the manifest.

### `buildAssets(entry)`

Build the asset bundle output for one page entry.

### `buildClient(entry)`

Build the client-side hydration entry for one page entry.

### `buildPage(entry, assets?)`

Build the server page module for one page entry.

If `assets` is omitted, Reactus builds the asset output first so it can inject generated stylesheet names.

## Manifest helpers

The build wrapper also exposes manifest helpers such as:

- `open(file)`
- `save(file)`
- `get(entry)`
- `values()`

## Related

- [Build and serve guide](../guides/build-and-serve.md)
- [Builder](./Builder.md)
- [DocumentBuilder](./DocumentBuilder.md)
