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