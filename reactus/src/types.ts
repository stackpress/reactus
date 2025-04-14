//node
import type { IncomingMessage, ServerResponse } from 'node:http';
//modules
import type { ElementType } from 'react';
import type { 
  InlineConfig, 
  PluginOption,
  DepOptimizationOptions
} from 'vite';
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
export type Next = () => void;

export type ViteConfig = InlineConfig;

export type DevelopConfig = {
  //base path (used in vite)
  basePath: string,
  //client script route prefix used in the document markup
  //ie. /client/[id][extname]
  //<script type="module" src="/client/[id][extname]"></script>
  //<script type="module" src="/client/abc123.tsx"></script>
  clientRoute: string,
  //template wrapper for the client script (tsx)
  clientTemplate: string,
  //filepath to a global css file
  cssFiles?: string[],
  //current working directory
  cwd: string,
  //template wrapper for the document markup (html)
  documentTemplate: string,
  //file system
  fs?: FileSystem,
  //vite optimization settings
  optimizeDeps?: DepOptimizationOptions,
  //vite plugins
  plugins: PluginOption[],
  //original vite options (overrides other settings related to vite)
  vite?: ViteConfig,
  //ignore files in watch mode
  watchIgnore?: string[]
};

export type BuildConfig = {
  //path where to save assets (css, images, etc)
  assetPath: string,
  //base path (used in vite)
  basePath: string,
  //path where to save the client scripts (js)
  clientPath: string,
  //template wrapper for the client script (tsx)
  clientTemplate: string,
  //filepath to a global css file
  cssFiles?: string[],
  //current working directory
  cwd: string,
  //file system
  fs?: FileSystem,
  //vite optimization settings
  optimizeDeps?: DepOptimizationOptions,
  //path where to save and load (live) the server script (js)
  pagePath: string,
  //template wrapper for the page script (tsx)
  pageTemplate: string,
  //vite plugins
  plugins: PluginOption[],
};

export type ProductionConfig = {
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
  fs?: FileSystem,
  //path where to save and load (live) the server script (js)
  pagePath: string,
  //template wrapper for the page script (tsx)
  //vite plugins
  plugins: PluginOption[]
};

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
  //filepath to a global css file
  // - used in dev mode and build step
  cssFiles?: string[],
  //style route prefix used in the document markup
  //ie. /assets/[id][extname]
  //<link rel="stylesheet" type="text/css" href="/client/[id][extname]" />
  //<link rel="stylesheet" type="text/css" href="/assets/abc123.css" />
  // - used in live server
  cssRoute: string,
  //current working directory
  cwd: string,
  //template wrapper for the document markup (html)
  // - used in dev mode and live server
  documentTemplate: string,
  //file system
  fs?: FileSystem,
  //vite optimization settings
  optimizeDeps?: DepOptimizationOptions,
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
  //original vite options (overrides other settings related to vite)
  vite?: ViteConfig,
  //ignore files in watch mode
  // - used in dev mode
  watchIgnore?: string[]
};