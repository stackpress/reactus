# Mental Model

Reactus is not a full frontend framework. It is a rendering and build layer for React pages that you serve from your own Node application.

That distinction matters because it explains both what Reactus simplifies and what it deliberately leaves to you.

## What Reactus does

Reactus gives you:

- server rendering for React page components
- browser hydration for interactive components
- Vite-based development and build integration
- helpers for resolving, tracking, building, and rendering page entries

## What Reactus does not do

Reactus does not choose:

- your backend framework
- your URL routing rules
- your API or data-fetching architecture
- your state management strategy

You still own your server and application structure. Reactus stays focused on page rendering.

If you want a client-routed SPA shell, Reactus can still do that, but you bring the routing library and client navigation architecture yourself. See [SPA-style routing](../guides/spa-style-routing.md).

## The main pieces

### Wrapper functions

Most applications start with one of these:

- `dev()`: development mode with middleware and HMR
- `build()`: build assets, client entries, and page modules
- `serve()`: render prebuilt pages in production

There is also a default `engine()` export that combines the lower-level capabilities in one object.

### Server

`Server` owns the shared runtime state:

- path settings
- route settings
- template strings
- the manifest of known documents
- Vite integration through `ServerResource`

`Builder` extends `Server` and adds the build-to-disk methods used during production preparation.

### Document

A `Document` represents one page entry such as `@/pages/home`.

Entries can point to either:

- a project-root file such as `@/pages/home`
- a package-style path such as `reactus-with-plugin/pages/contact`

It bundles three focused helpers:

- `DocumentLoader`: find and import the page
- `DocumentBuilder`: build assets, client code, and page modules
- `DocumentRender`: turn the page into final HTML

### Manifest

`ServerManifest` tracks the documents you want to work with. In practice, that means:

- adding entries with `set()`
- checking whether an entry already exists
- saving and loading a manifest for production builds

### Resource

`ServerResource` is the Vite bridge. It creates the dev server, returns middleware, resolves plugins, and runs builds.

## Typical lifecycle

### Development

1. Create an engine with `dev()`.
2. Pass requests through `engine.http(req, res)`.
3. Call `engine.render(entry, props)` for page routes.

### Build

1. Create a build engine with `build()`.
2. Add entries to the manifest with `set()`.
3. Run `buildAllAssets()`, `buildAllClients()`, and `buildAllPages()`.

### Production

1. Create a production engine with `serve()`.
2. Load the prebuilt page modules from disk.
3. Serve static assets yourself and call `render()` for page routes.

## Why this shape is useful

Reactus gives you SSR and hydration without forcing your whole application into a framework-shaped box.

That makes it useful when you want:

- React pages inside an existing Node server
- full control over routing
- Vite plugins without building a separate SPA
- a simple server-props model instead of a heavier application runtime
