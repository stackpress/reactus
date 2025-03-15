//node
import crypto from 'node:crypto';

/**
 * Returns true if the value is a native JS object
 */
export function isHash(value: unknown) {
  return typeof value === 'object' && value?.constructor?.name === 'Object';
};

/**
 * Creates a hash salt of a string
 */
export function hash(string: string, length = 64) {
  return crypto
    .createHash('shake256')
    .update(string)
    .digest('hex')
    .substring(0, length);
}

export const reference = '/// <reference types="vite/client" />';

export const doc = `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <!--page-head-->
  </head>
  <body>
    <div id="root"><!--page-body--></div>
    <script type="module" src="<!--page-client-->"></script>
  </body>
</html>
`.trim();

export const client = `
import { StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import App from '{entry}'

hydrateRoot(
  document.getElementById('root') as HTMLElement,
  <StrictMode>
    <App />
  </StrictMode>,
)
`.trim();