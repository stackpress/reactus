# DocumentLoader

`DocumentLoader` resolves and imports a single document.

```ts
const document = await engine.set('@/pages/home');
const loader = document.loader;
```

## Methods

### `absolute()`

Return the absolute source path for the document entry.

```ts
const absolutePath = await loader.absolute();
```

### `import()`

Import the page module for the current mode.

```ts
const pageModule = await loader.import();
```

In production mode, this loads the built page file from `paths.page`. In development mode, it loads the source module through Vite.

### `relative(fromFile)`

Return the path from another file to the document entry.

```ts
const relativePath = await loader.relative('/tmp/virtual-file.tsx');
```

**Returns**

For project-root entries such as `@/pages/home`, this returns a relative file path. For package-style entries, it returns the entry string unchanged.

## Related

- [Document](./Document.md)
- [ServerLoader](./ServerLoader.md)
