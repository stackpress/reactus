# CSS Frameworks

Use this guide when you want to add shared CSS or bring a Vite-based CSS framework into Reactus.

## Add one global stylesheet

If every page should include the same stylesheet, use `cssFiles`.

```ts
const engine = dev({
  cwd: process.cwd(),
  basePath: '/',
  clientRoute: '/client',
  cssFiles: ['public/global.css']
});
```

Reactus will include those files through its Vite integration.

## Add page-local CSS

The examples also use page-local CSS by importing a stylesheet directly from the page component:

```tsx
import './contact.css';
```

This is a good fit when a stylesheet belongs to one page instead of the whole app.

## Tailwind

The simplest Reactus-side setup is to point `cssFiles` at the stylesheet that imports Tailwind.

```ts
import path from 'node:path';
import { dev } from 'reactus';

const cwd = process.cwd();

const engine = dev({
  cwd,
  basePath: '/',
  clientRoute: '/client',
  cssFiles: [path.join(cwd, 'tailwind.css')]
});
```

Reactus does not configure Tailwind for you. You still manage the Tailwind config and stylesheet in your own project.

## UnoCSS

UnoCSS works well because Reactus accepts Vite plugins directly.

```ts
import UnoCSS from 'unocss/vite';
import { dev } from 'reactus';

const engine = dev({
  cwd: process.cwd(),
  basePath: '/',
  clientRoute: '/client',
  plugins: [UnoCSS()],
  cssFiles: ['reactus/fouc.css', 'virtual:uno.css']
});
```

Why both files:

- `reactus/fouc.css` helps reduce flash-of-unstyled-content during hydration
- `virtual:uno.css` is UnoCSS's generated stylesheet entry

## Render built styles in `Head()`

When a page exports `Head()`, you can accept an optional `styles` prop and render built stylesheet links there:

```tsx
export function Head({ styles = [] }: { styles?: string[] }) {
  return (
    <>
      <title>How It Works</title>
      {styles.map((href, index) => (
        <link key={index} rel="stylesheet" href={href} />
      ))}
    </>
  );
}
```

This matters most in production builds, where Reactus knows the generated asset names and passes them into `Head()`.

## Build mode uses the same idea

If you add CSS files or Vite plugins in development, carry those settings into `build()` so the built assets match your dev setup.

## Next steps

- Read [Development server](./development-server.md) for the full `dev()` flow.
- Read [Configuration reference](../api/configuration.md) for `cssFiles` and `plugins`.
