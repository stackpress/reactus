# ServerLoader

`ServerLoader` is the lower-level file and module loader used by Reactus.

```ts
import { ServerLoader } from 'reactus';
```

Most applications do not create this class directly. You usually reach it through `server.loader`.

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `cwd` | `string` | Working directory used for resolution. |
| `fs` | `FileSystem` | File system implementation used by the loader. |

## Methods

### `absolute(pathname, pwd?)`

Return an absolute path without asserting that the file is a valid entry module.

### `fetch(url)`

Load a module through the Vite dev server.

### `import(pathname, extnames?)`

Import a module path.

In production mode, or when the resolved extension is `.js`, this uses native module import. Otherwise it loads through Vite.

### `relative(pathname, require, withExtname?)`

Return the relative path between two file paths.

### `resolveFile(pathname, extnames?, pwd?, exists?)`

Resolve a file path using the underlying file loader.

### `resolve(pathname, extnames?)`

Resolve an entry path to:

- `filepath`
- `basepath`
- `extname`

## Related

- [Server](./Server.md)
- [DocumentLoader](./DocumentLoader.md)
