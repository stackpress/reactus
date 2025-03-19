//node
import type { IncomingMessage, ServerResponse } from 'node:http';
//modules
import type { ElementType } from 'react';
import type { InlineConfig, PluginOption } from 'vite';
import type { OutputChunk, OutputAsset } from 'rollup';
//stackpress
import type { 
  FileSystem, 
  ErrorResponse, 
  SuccessResponse 
} from '@stackpress/lib/types';
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

export type IM = IncomingMessage;
export type SR = ServerResponse<IM>;

export type ViteConfig = InlineConfig;

export type ServerConfig = {
  //path where to save assets (css, images, etc)
  // - used in build step
  assetPath: string,
  //base path (used in vite)
  // - used in dev mode
  basePath: string,
  //path where to save the client scripts (js)
  // - used in build step
  clientPath: string,
  //client script route prefix used in the document markup
  //ie. /client/[id][extname]
  //<script type="module" src="/client/[id][extname]"></script>
  //<script type="module" src="/client/abc123.tsx"></script>
  // - used in dev mode and live server
  clientRoute: string,
  //template wrapper for the client script (tsx)
  // - used in dev mode and build step
  clientTemplate: string,
  //current working directory
  cwd: string,
  //template wrapper for the document markup (html)
  // - used in dev mode and live server
  documentTemplate: string,
  //file system
  fs?: FileSystem,
  //global head component path
  globalHead?: string,
  //global css file path
  globalCSS?: string,
  //path where to save and load (live) the server script (js)
  // - used in build step and live server
  pagePath: string,
  //template wrapper for the page script (tsx)
  // - used in build step
  pageTemplate: string,
  //vite plugins
  plugins: PluginOption[],
  //directs resolvers and markup generator
  production: boolean,
  //style route prefix used in the document markup
  //ie. /assets/[id][extname]
  //<link rel="stylesheet" type="text/css" href="/client/[id][extname]" />
  //<link rel="stylesheet" type="text/css" href="/assets/abc123.css" />
  // - used in live server
  styleRoute: string,
  //original vite options (overrides other settings related to vite)
  vite?: ViteConfig,
  //ignore files in watch mode
  // - used in dev mode
  watchIgnore?: string[]
};