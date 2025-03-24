# ☢️ Reactus

[![NPM Package](https://img.shields.io/npm/v/reactus.svg?style=flat)](https://www.npmjs.com/package/reactus)
[![Commits](https://img.shields.io/github/last-commit/stackpress/reactus)](https://github.com/stackpress/reactus/commits/main/)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg?style=flat)](https://github.com/stackpress/reactus/blob/main/LICENSE)

Reactive React Template Engine

## Install

```bash
npm i -D typescript ts-node tsx @types/node @types/react @types/react-dom
npm i reactus react react-dom
```

## Development Server

The following example shows how to use reactus in development mode 
with `node:http`. Create a `server.ts` file in your project root 
with the following code.

```js
import { createServer } from 'node:http';
import { dev } from 'reactus';

const engine = dev({ cwd: process.cwd() });

const server = createServer(async (req, res) => {
  //handles public, assets and hmr
  await engine.http(req, res);
  //if middleware was triggered
  if (res.headersSent) return;
  // home page
  if (req.url === '/') {
    res.setHeader('Content-Type', 'text/html');
    res.end(await engine.render('@/home', { title: 'Home' }));
    return;
  }
  res.end('404 Not Found');
});

server.listen(3000, () => {
  console.log('Server running at http://localhost:3000/');
});
```

Then create a `home.tsx` file in your project root 
with the following code.

```js
export default function HomePage() {
  return (
    <>
      <h1>Reactus</h1>
      <p>This is the Reactus template engine</p>
    </>
  )
}
```

Next start the server and visit `http://localhost:3000/`.

```bash
$ npx tsx server.ts
```


### Development Configuration

The following are valid options you can use during development.

```js
type DevelopConfig = {
  //base path (used in vite)
  basePath: string,
  //client script route prefix used in the document markup
  //ie. /client/[id][extname]
  //<script type="module" src="/client/[id][extname]"></script>
  //<script type="module" src="/client/abc123.tsx"></script>
  clientRoute: string,
  //template wrapper for the client script (tsx)
  clientTemplate: string,
  //filepath to a global css file
  cssFile?: string,
  //current working directory
  cwd: string,
  //template wrapper for the document markup (html)
  documentTemplate: string,
  //file system
  fs?: FileSystem,
  //vite plugins
  plugins: PluginOption[],
  //original vite options (overrides other settings related to vite)
  vite?: ViteConfig,
  //ignore files in watch mode
  watchIgnore?: string[]
}
```


## Building Files

The following example shows how to use reactus to build your files 
for production use. Create a `build.ts` file in your project root 
with the following code.

```js
import path from 'node:path';
import { build } from 'reactus';

const cwd = process.cwd();
const engine = build({
  cwd,
  //path where to save assets (css, images, etc)
  assetPath: path.join(cwd, 'public/assets'),
  //path where to save and load (live) the client scripts (js)
  clientPath: path.join(cwd, 'public/client'),
  //path where to save and load (live) the server script (js)
  pagePath: path.join(cwd, '.build/pages')
});

//add page templates to build
await engine.set('@/home');

//build everything
const responses = [
  ...await engine.buildAllClients(),
  ...await engine.buildAllAssets(),
  ...await engine.buildAllPages()
].map(response => {
  const results = response.results;
  if (typeof results?.contents === 'string') {
    results.contents = results.contents.substring(0, 100) + ' ...';
  }
  return results;
});

console.log(responses);
```

Next run the build.

```bash
$ npx tsx build.ts
```

### Build Configuration

The following are valid options you can use during build.

```js
type BuildConfig = {
  //path where to save assets (css, images, etc)
  assetPath: string,
  //base path (used in vite)
  basePath: string,
  //path where to save the client scripts (js)
  clientPath: string,
  //template wrapper for the client script (tsx)
  clientTemplate: string,
  //filepath to a global css file
  cssFile?: string,
  //current working directory
  cwd: string,
  //file system
  fs?: FileSystem,
  //path where to save and load (live) the server script (js)
  pagePath: string,
  //template wrapper for the page script (tsx)
  pageTemplate: string,
  //vite plugins
  plugins: PluginOption[],
}
```

## Previewing Production

The following example shows how to use reactus to preview your build 
files with `node:http`, that will be used in production before you 
deploy. Install `sirv` to serve static assets.

```bash
$ npm i sirv
```

Next, create a `preview.ts` file in your project root with the 
following code.

```js
import { createServer } from 'node:http';
import path from 'node:path';
import sirv from 'sirv';
import { serve } from 'reactus';

const cwd = process.cwd();
const engine = serve({
  cwd,
  //ie. /client/[id][extname]
  //<script type="module" src="/client/[id][extname]"></script>
  //<script type="module" src="/client/abc123.tsx"></script>
  clientRoute: '/client',
  //css route prefix used in the document markup
  //ie. /assets/[id][extname]
  //<link rel="stylesheet" type="text/css" href="/client/[id][extname]" />
  //<link rel="stylesheet" type="text/css" href="/assets/abc123.css" />
  cssRoute: '/assets',
  //path where to load the server script (js)
  pagePath: path.join(cwd, '.build/pages')
});
// Init `sirv` handler
const assets = sirv(path.join(cwd, 'public'), {
  maxAge: 31536000, // 1Y
  immutable: true
});

const server = createServer(async (req, res) => {
  // home page
  if (req.url === '/') {
    res.setHeader('Content-Type', 'text/html');
    res.end(await engine.render('@/home'));
    return;
  }
  //static asset server
  assets(req, res);
  //if static asset was triggered
  if (res.headersSent) return;
  res.end('404 Not Found');
});

server.listen(3000, () => {
  console.log('Server running at http://localhost:3000/');
});
```

Next start the server and visit `http://localhost:3000/`.

```bash
$ npx tsx preview.ts
```

### Preview Configuration

The following are valid options you can use during preview.

```js
type ProductionConfig = {
  //client script route prefix used in the document markup
  //ie. /client/[id][extname]
  //<script type="module" src="/client/[id][extname]"></script>
  //<script type="module" src="/client/abc123.tsx"></script>
  clientRoute: string,
  //style route prefix used in the document markup
  //ie. /assets/[id][extname]
  //<link rel="stylesheet" type="text/css" href="/client/[id][extname]" />
  //<link rel="stylesheet" type="text/css" href="/assets/abc123.css" />
  cssRoute: string,
  //current working directory
  cwd: string,
  //template wrapper for the document markup (html)
  documentTemplate: string,
  //file system
  fs?: FileSystem,
  //path where to save and load (live) the server script (js)
  pagePath: string,
  //template wrapper for the page script (tsx)
  //vite plugins
  plugins: PluginOption[]
}
```

See [examples](https://github.com/stackpress/reactus/tree/main/examples)
for more examples with **TailwindCSS** and **UnoCSS**.