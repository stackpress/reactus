# ServerResource

`ServerResource` is the Vite bridge used by Reactus.

```ts
const resource = engine.server.resource;
```

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `base` | `string` | Active Vite base path. |
| `config` | `InlineConfig \| null` | Original Vite config passed into Reactus. |

## Methods

### `build(config)`

Run a Vite build with the Reactus plugin set.

```ts
const result = await resource.build({
  configFile: false,
  build: { write: false }
});
```

### `dev()`

Create or return the cached Vite dev server.

### `middlewares()`

Return the Vite middleware stack.

### `plugins()`

Return the full plugin list Reactus will give to Vite.

That list includes:

- optional CSS injection support from `cssFiles`
- the Reactus virtual file system plugin
- the Reactus file loader plugin
- `@vitejs/plugin-react`
- any user-supplied Vite plugins

## Related

- [Server](./Server.md)
- [CSS frameworks guide](../guides/css-frameworks.md)
