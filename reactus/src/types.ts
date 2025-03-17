//modules
import type { ElementType } from 'react';
import type { InlineConfig } from 'vite';
import type { 
  OutputChunk, 
  OutputAsset,
  RollupOutput, 
  RollupWatcher
} from 'rollup';
//stackpress
import type { 
  FileSystem, 
  ErrorResponse, 
  SuccessResponse 
} from '@stackpress/lib';
//local
import type Document from './Document';

//--------------------------------------------------------------------//
// Manifest Types

export type BuildStatus = Partial<ErrorResponse & SuccessResponse<{
  type: 'page' | 'client' | 'asset',
  id: string,
  entry: string,
  contents: string | Uint8Array<ArrayBufferLike>,
  source?: string,
  destination: string
}>>;

//--------------------------------------------------------------------//
// Document Types

export type BuildResults = [OutputChunk, ...(OutputChunk | OutputAsset)[]]

export type DocumentImport = { 
  default: ElementType, 
  Head?: ElementType,
  styles?: string[]
};

export type DocumentIterator<T = unknown> = (
  document: Document, 
  index: number
) => T

//--------------------------------------------------------------------//
// Server Types

export type ViteBuildAction = (
  inlineConfig?: InlineConfig
) => Promise<RollupOutput | RollupOutput[] | RollupWatcher>

export type ViteConfig = InlineConfig;

export type ServerConfig = {
  fs?: FileSystem,
  cwd?: string,
  vite?: ViteConfig,
  //path where to save assets (css, images, etc)
  assetPath: string,
  //path where to save and load (live) the client scripts (js)
  clientPath: string,
  //client script route prefix used in the document markup
  //ie. /client/[id][extname]
  //<script type="module" src="/client/[id][extname]"></script>
  //<script type="module" src="/client/abc123.tsx"></script>
  clientRoute: string,
  //template wrapper for the client script (tsx)
  clientTemplate: string,
  //template wrapper for the document markup (html)
  documentTemplate: string,
  //path where to save and load (live) the server script (js)
  pagePath: string,
  //template wrapper for the page script (tsx)
  pageTemplate: string,
  //style route prefix used in the document markup
  //ie. /assets/[id][extname]
  //<link rel="stylesheet" type="text/css" href="/client/[id][extname]" />
  //<link rel="stylesheet" type="text/css" href="/assets/abc123.css" />
  styleRoute: string
};