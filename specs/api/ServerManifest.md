# ServerManifest

`ServerManifest` tracks the set of documents known to a `Server` or `Builder`.

```ts
const manifest = engine.server.manifest;
```

## Property

| Property | Type | Description |
| --- | --- | --- |
| `size` | `number` | Number of tracked documents. |

## Methods

### `set(entry)`

Add an entry to the manifest and return its `Document`.

```ts
const document = await manifest.set('@/pages/home');
```

### `get(entry)`

Return the matching `Document` or `null`.

### `has(entry)`

Return `true` when the manifest already contains the entry.

### `find(id)`

Return a `Document` by generated document id.

### `entries()`

Return an array created from the tracked documents. This helper is intended for iteration and mirrors the manifest order.

### `values()`

Return the tracked documents.

### `map(callback)` and `forEach(callback)`

Iterate across the tracked documents.

### `toJSON()`

Return a hash of `document.id -> document.entry`.

### `load(hash)`

Load entries from an object hash.

### `open(file)`

Read a manifest JSON file from disk and load it.

### `save(file)`

Write the current manifest hash to disk.

## Related

- [Document](./Document.md)
- [build()](./build.md)
