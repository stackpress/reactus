# DocumentRender

`DocumentRender` turns one document into browser-ready HTML.

```ts
const document = await engine.set('@/pages/home');
const render = document.render;
```

## Methods

### `renderHMRClient()`

Return the development HMR client module for the document.

```ts
const code = await render.renderHMRClient();
```

Use this only in development-oriented tooling. Most apps call `engine.http()` and let Reactus handle the dev server path automatically.

### `renderMarkup(props?)`

Render the document to final HTML.

```ts
const html = await render.renderMarkup({ title: 'Home' });
```

In development mode, Reactus uses Vite transforms and injects the dev client path. In production mode, Reactus imports the built page module and injects built CSS and client routes.

If the page exports `Head()`, production rendering passes a `styles` array into that component so it can render `<link rel="stylesheet">` tags for built CSS files.

## Related

- [dev()](./dev.md)
- [serve()](./serve.md)
- [DocumentLoader](./DocumentLoader.md)
