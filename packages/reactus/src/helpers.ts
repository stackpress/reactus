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

export const HASH_LENGTH = 16;

export const REFERENCE = '/// <reference types="vite/client" />';

export const DOCUMENT_TEMPLATE = `
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

export const PAGE_TEMPLATE = `
import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import Page from '{entry}';

export function render(_url: string) {
  return renderToString(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  return { html };
}
`.trim();

export const CLIENT_TEMPLATE = `
import { StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import Page from '{entry}';

await hydrateRoot(
  document.getElementById('root') as HTMLElement, 
  <StrictMode>
    <Page />
  </StrictMode>
);
`.trim();