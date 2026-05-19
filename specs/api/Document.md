# Document

`Document` represents one page entry such as `@/pages/home`.

```ts
import { dev } from 'reactus';

const engine = dev({ cwd: process.cwd() });
const document = await engine.set('@/pages/home');
```

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `entry` | `string` | Entry identifier such as `@/pages/home`. |
| `server` | `Server` | Parent `Server` or `Builder`. |
| `builder` | `DocumentBuilder` | Per-document build helper. |
| `loader` | `DocumentLoader` | Per-document file and module loader. |
| `render` | `DocumentRender` | Per-document HTML renderer. |
| `id` | `string` | Generated id based on the entry path. |

## Notes

- `id` is derived from the entry path and file basename.
- Valid entry formats include project-root paths such as `@/pages/home` and package-style paths such as `reactus-with-plugin/pages/contact`.
- The `Document` object is mostly a coordinator. The actual work happens in its `builder`, `loader`, and `render` helpers.

## Related

- [DocumentBuilder](./DocumentBuilder.md)
- [DocumentLoader](./DocumentLoader.md)
- [DocumentRender](./DocumentRender.md)
