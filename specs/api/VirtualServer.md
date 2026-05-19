# VirtualServer

`VirtualServer` is the in-memory file store Reactus uses for generated TSX modules during development and build steps.

```ts
import { VirtualServer } from 'reactus';
```

## Property

| Property | Type | Description |
| --- | --- | --- |
| `fs` | internal callable map | Base64-encoded virtual file contents. |

## Methods

### `set(filepath, contents)`

Store contents in the virtual file system.

```ts
const url = vfs.set('/tmp/page.client.tsx', 'export default 1;');
```

**Returns**

A VFS URL string that Reactus can hand to Vite.

### `get(filepath)`

Return decoded file contents or `null`.

### `has(filepath)`

Return `true` when a virtual file exists.

## Related

- [ServerResource](./ServerResource.md)
- [DocumentBuilder](./DocumentBuilder.md)
