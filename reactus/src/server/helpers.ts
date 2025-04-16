//node
import path from 'node:path';
import crypto from 'node:crypto';
//modules
import type { ElementType } from 'react';
import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { jsx } from 'react/jsx-runtime';
//stackpress
import type { UnknownNest } from '@stackpress/lib/types';
import NodeFS from '@stackpress/lib/NodeFS';
//serve
import type { ServerConfig } from './types.js';
import { 
  BASE62_ALPHABET,
  DOCUMENT_TEMPLATE,
  HASH_LENGTH
} from './constants.js';

export function configure(options: Partial<ServerConfig>) {
  const cwd = options.cwd || process.cwd();
  return Object.freeze({
    //client script route prefix used in the document markup
    //ie. /client/[id][extname]
    //<script type="module" src="/client/[id][extname]"></script>
    //<script type="module" src="/client/abc123.tsx"></script>
    // - used in dev mode and live server
    clientRoute: options.clientRoute || '/client',
    //style route prefix used in the document markup
    //ie. /assets/[id][extname]
    //<link rel="stylesheet" type="text/css" href="/client/[id][extname]" />
    //<link rel="stylesheet" type="text/css" href="/assets/abc123.css" />
    // - used in live server
    cssRoute: options.cssRoute || '/assets',
    //current working directory
    cwd: options.cwd || process.cwd(),
    //template wrapper for the document markup (html)
    // - used in dev mode and live server
    documentTemplate: options.documentTemplate || DOCUMENT_TEMPLATE,
    //file system
    fs: options.fs || new NodeFS(),
    //path where to save and load (live) the server script (js)
    // - used in build step and live server
    pagePath: options.pagePath || path.join(cwd, '.reactus/page')
  });
};

/**
 * Creates an id based on the given content
 */
export function id(content: string, length = HASH_LENGTH) {
  //make an md5 hash
  const md5 = crypto.createHash('md5').update(content).digest('hex');
  //Convert first 12 hex digits to a number
  let num = parseInt(md5.slice(0, 12), 16); 
  //hash buffer
  let hash = '';
  while (num > 0) {
    //Get remainder within Base62 range
    const index = num % 62; 
    hash = BASE62_ALPHABET[index] + hash;
    //Integer division
    num = Math.floor(num / 62); 
  }
  //Trim to desired length
  return hash.padStart(length, '0').slice(0, length);
}

/**
 * Renders JSX element to string
 */
export function renderJSX(element?: ElementType, props: UnknownNest = {}) {
  return element ? renderToString(
    jsx(StrictMode, { children: jsx(element, { ...props }) })
  ): '';
}