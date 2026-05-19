# Configuration Types

These are the public configuration shapes exported from `reactus/types`.

## `DevelopConfig`

Used by `dev()`.

| Field | Type | Required | Default from `Server.configure()` |
| --- | --- | --- | --- |
| `basePath` | `string` | No | `'/'` |
| `clientRoute` | `string` | No | `'/client'` |
| `clientTemplate` | `string` | No | built-in client template |
| `cssFiles` | `string[]` | No | `undefined` |
| `cwd` | `string` | No | `process.cwd()` |
| `documentTemplate` | `string` | No | built-in document template |
| `fs` | `FileSystem` | No | `NodeFS` |
| `optimizeDeps` | `DepOptimizationOptions` | No | `undefined` |
| `plugins` | `PluginOption[]` | No | `[]` |
| `vite` | `InlineConfig` | No | `undefined` |
| `watchIgnore` | `string[]` | No | `[]` |

## `BuildConfig`

Used by `build()`.

| Field | Type | Required | Default from `Server.configure()` |
| --- | --- | --- | --- |
| `assetPath` | `string` | No | `path.join(cwd, '.reactus/assets')` |
| `basePath` | `string` | No | `'/'` |
| `clientPath` | `string` | No | `path.join(cwd, '.reactus/client')` |
| `clientTemplate` | `string` | No | built-in client template |
| `cssFiles` | `string[]` | No | `undefined` |
| `cwd` | `string` | No | `process.cwd()` |
| `fs` | `FileSystem` | No | `NodeFS` |
| `optimizeDeps` | `DepOptimizationOptions` | No | `undefined` |
| `pagePath` | `string` | No | `path.join(cwd, '.reactus/page')` |
| `pageTemplate` | `string` | No | built-in page template |
| `plugins` | `PluginOption[]` | No | `[]` |

## `ProductionConfig`

Used by `serve()`.

| Field | Type | Required | Default from `Server.configure()` |
| --- | --- | --- | --- |
| `clientRoute` | `string` | No | `'/client'` |
| `cssRoute` | `string` | No | `'/assets'` |
| `cwd` | `string` | No | `process.cwd()` |
| `documentTemplate` | `string` | No | built-in document template |
| `fs` | `FileSystem` | No | `NodeFS` |
| `pagePath` | `string` | No | `path.join(cwd, '.reactus/page')` |
| `plugins` | `PluginOption[]` | No | `[]` |

## `ServerConfig`

This is the full merged shape used by `Server` and the default `engine()` export.

It includes every field from development, build, and production, plus:

- `production: boolean`

## Notes

- The wrapper functions accept `Partial<...Config>` and pass those values through `Server.configure()`.
- In practice, you can omit many fields and rely on defaults, but it is usually clearer to set `cwd`, `clientRoute`, and your output paths explicitly.
