export const VFS_PROTOCOL = 'virtual:reactus:';
export const VFS_RESOLVED = '\0virtual:reactus:';

export const BASE62_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

export const HASH_LENGTH = 32;

export const DOCUMENT_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <!--document-head-->
  </head>
  <body>
    <div id="root"><!--document-body--></div>
    <script id="props" type="text/json"><!--document-props--></script>
    <script type="module" src="<!--document-client-->"></script>
  </body>
</html>
`.trim();

export const PAGE_TEMPLATE = `
import Body from '{entry}';
export * from '{entry}';
export const styles = {styles};
export default Body;
`.trim();

export const CLIENT_TEMPLATE = `
import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import Page from '{entry}';
const root = document.getElementById('root');
const data = document.getElementById('props');
const props = JSON.parse(data?.innerText || '{}');
hydrateRoot(
  root as HTMLElement, 
  <React.StrictMode>
    <Page {...props} />
  </React.StrictMode>
);
`.trim();