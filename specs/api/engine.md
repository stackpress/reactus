# `engine()` Default Export

The default export returns a combined engine that exposes development, build, manifest, loader, and render helpers from one object.

```ts
import engine from 'reactus';

const app = engine({
  cwd: process.cwd(),
  production: false
});
```

Most applications do not need this entrypoint. The explicit wrappers are easier to reason about:

- `dev()` for development rendering
- `build()` for build scripts
- `serve()` for production rendering

Use the default export when you want one object with access to:

- `http()` and `dev()`
- build helpers such as `buildAllAssets()`
- loader helpers such as `fetch()` and `resolve()`
- manifest helpers such as `set()` and `save()`
- render helpers such as `render()` and `renderHMR()`

## Related

- [dev()](./dev.md)
- [build()](./build.md)
- [serve()](./serve.md)
