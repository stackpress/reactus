# DocumentBuilder

`DocumentBuilder` builds the generated files for one `Document`.

```ts
const document = await engine.set('@/pages/home');
const builder = document.builder;
```

## Property

| Property | Type | Description |
| --- | --- | --- |
| implicit parent | `Document` | The helper is created from a `Document` and uses its entry and parent server state. |

## Methods

### `buildAssets()`

Build the asset output for one document.

```ts
const output = await builder.buildAssets();
```

**Returns**

The raw Rollup output array for the asset build.

### `buildClient()`

Build the client hydration entry for one document.

```ts
const output = await builder.buildClient();
```

### `buildPage(assets?)`

Build the server page module for one document.

```ts
const assets = await builder.buildAssets();
const output = await builder.buildPage(assets);
```

If `assets` is omitted, Reactus builds the assets first so it can inject generated CSS file names into the page module.

## Related

- [Builder](./Builder.md)
- [DocumentRender](./DocumentRender.md)
