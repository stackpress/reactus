//modules
import type { ElementType } from 'react';
import type { ViteDevServer } from 'vite';
//stackpress
import type { FileSystem } from '@stackpress/lib';
//local
import type Build from './Page';

//--------------------------------------------------------------------//
// Build Types

export type ForEachCallback = (build: Build, index?: number) => unknown;
export type MapCallback<T> = (build: Build, index: number) => T;
export type BuildMode = 'development' | 'build' | 'production';
export type PageImport = { default: ElementType, Head?: ElementType };

//--------------------------------------------------------------------//
// Loader Types

export type LoaderOptions = { cwd: string, fs: FileSystem };

//--------------------------------------------------------------------//
// Manifest Types

export type ViteConnect = () => Promise<ViteDevServer|null>;
export type ManifestOptions = {
  //callback to lazily connect to vite dev server
  connect: ViteConnect,
  //location to where to put the final client scripts (js)
  clientBuildPath: string, //ie. .reactus/build/client
  //client script route prefix used in the document markup
  //ie. /client/[id][extname]
  //<script type="module" src="/client/[id][extname]"></script>
  //<script type="module" src="/client/abc123.tsx"></script>
  clientRoute: string,
  //location to where to put the client scripts for dev and build (tsx)
  clientSourcePath: string, //ie. .reactus/src/client
  //template wrapper for the client script (tsx)
  clientTemplate: string,
  //template wrapper for the document markup (html)
  documentTemplate: string,
  //location to where to put the manifest file (json)
  manifestPath: string, //ie. .reactus/manifest.json
  //location to where to put the final page entry (js)
  pageBuildPath: string, //ie. .reactus/build/page
  //location to where to put the page scripts for build (tsx)
  pageSourcePath: string //ie. .reactus/src/page
  //template wrapper for the page script (tsx)
  pageTemplate: string
};

//--------------------------------------------------------------------//
// Reactus Types

export type ReactusOptions = Partial<LoaderOptions & ManifestOptions>;
