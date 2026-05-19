# Build And Serve

Use this guide when you want to prebuild Reactus files and then render from those build artifacts in production.

## Build files with `build()`

Create a build script.

```ts
import path from 'node:path';
import { build } from 'reactus';

async function runBuild() {
  const cwd = process.cwd();
  const engine = build({
    cwd,
    assetPath: path.join(cwd, 'public/assets'),
    clientPath: path.join(cwd, 'public/client'),
    pagePath: path.join(cwd, '.build/pages')
  });

  await engine.set('@/pages/home');
  await engine.set('@/pages/about');

  await engine.buildAllClients();
  await engine.buildAllAssets();
  await engine.buildAllPages();
}

runBuild().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

## What gets written

The build step writes three kinds of output:

- assets such as CSS and emitted asset files
- browser client entries used for hydration
- server page modules used by `serve()`

## Build entries from another package or workspace

The examples also show a second entry style:

```ts
await engine.set('reactus-with-plugin/pages/contact');
await engine.set('reactus-with-plugin/pages/how');
```

Use this when your rendered pages come from another workspace package instead of the current project's `@/pages/...` tree.

## Serve the built output

After the build, switch to `serve()`.

```ts
import { createServer } from 'node:http';
import path from 'node:path';
import sirv from 'sirv';
import { serve } from 'reactus';

async function start() {
  const cwd = process.cwd();
  const engine = serve({
    cwd,
    clientRoute: '/client',
    cssRoute: '/assets',
    pagePath: path.join(cwd, '.build/pages')
  });

  const assets = sirv(path.join(cwd, 'public'), {
    maxAge: 31536000,
    immutable: true
  });

  const server = createServer(async (req, res) => {
    if (req.url === '/') {
      res.setHeader('Content-Type', 'text/html');
      res.end(await engine.render('@/pages/home'));
      return;
    }

    assets(req, res);
    if (res.headersSent) return;

    res.statusCode = 404;
    res.end('404 Not Found');
  });

  server.listen(3000);
}
```

## Render built CSS through `Head()`

When a built page emits CSS, Reactus passes the generated stylesheet URLs into the page's `Head()` component as `styles`.

```tsx
export function Head({ styles = [] }: { styles?: string[] }) {
  return (
    <>
      <title>Contact Us</title>
      {styles.map((href, index) => (
        <link key={index} rel="stylesheet" href={href} />
      ))}
    </>
  );
}
```

This keeps CSS injection explicit at the page level while still letting `build()` compute the final asset file names for you.

## Keep the responsibilities clear

`build()` prepares files.

`serve()` renders HTML against the built page modules.

Your production server still needs to:

- serve static files from disk
- route requests
- decide cache headers and deployment behavior

## Save and load a manifest when useful

If you want to persist the known entries between runs, use the manifest helpers on the wrapper:

```ts
await engine.save('./dist/manifest.json');
await engine.open('./dist/manifest.json');
```

These call through to `ServerManifest`.

## Next steps

- Read [API reference for `build()`](../api/build.md).
- Read [API reference for `serve()`](../api/serve.md).
- Read [ServerManifest](../api/ServerManifest.md) if you need manifest persistence.
