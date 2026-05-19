# `serve()`

Create a production rendering engine that loads prebuilt page modules from disk.

```ts
import path from 'node:path';
import { serve } from 'reactus';

const engine = serve({
  cwd: process.cwd(),
  clientRoute: '/client',
  cssRoute: '/assets',
  pagePath: path.join(process.cwd(), '.build/pages')
});
```

Use `serve()` after you already built the page modules with `build()`.

## Common properties

| Property | Description |
| --- | --- |
| `config` | Final merged configuration. |
| `paths` | Active page and asset path settings. |
| `routes` | Client and CSS route prefixes. |
| `templates` | Active document template values. |
| `server` | The underlying `Server` instance. |

## Common methods

### `render(entry, props?)`

Render a built page module to final HTML.

```ts
const html = await engine.render('@/pages/home', { title: 'Home' });
```

### `importPage(entry)`

Import the compiled page module that production rendering will use.

### `absolute(entry)` and `id(entry)`

Resolve the source file path or generated document id for an entry.

## Important limitation

`serve()` renders built page modules. It does not serve static assets for you.

Your production server still needs to serve:

- built CSS
- built client JavaScript
- any public files such as images or icons

## Related

- [Build and serve guide](../guides/build-and-serve.md)
- [DocumentLoader](./DocumentLoader.md)
- [DocumentRender](./DocumentRender.md)
