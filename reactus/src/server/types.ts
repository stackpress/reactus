//modules
import type { ElementType } from 'react';
//stackpress
import type { FileSystem } from '@stackpress/lib/types';

export type DocumentImport = { 
  default: ElementType, 
  Head?: ElementType,
  styles?: string[]
};

export type ServerConfig = {
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
  fs: FileSystem,
  //path where to save and load (live) the server script (js)
  pagePath: string
};