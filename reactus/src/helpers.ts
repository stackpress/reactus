//node
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
//stackpress
import type { UnknownNest } from '@stackpress/lib/types';
//modules
import type { ElementType } from 'react';
import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { jsx } from 'react/jsx-runtime';
//local
import { 
  HASH_LENGTH, 
  BASE62_ALPHABET
} from './constants.js';

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

/**
 * Creates folder if necessary and writes file
 */
export async function writeFile(
  file: string, 
  contents: string|Uint8Array<ArrayBufferLike>
) {
  const dirname = path.dirname(file);
  //if the folder doesn't exist, create it
  if (!await fs.stat(dirname).catch(() => false)) {
    await fs.mkdir(dirname, { recursive: true });
  }
  //now cache the tsx code
  await fs.writeFile(file, contents);
  return file;
}