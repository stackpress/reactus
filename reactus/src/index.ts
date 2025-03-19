export type * from './types';
export * from './constants';
export * from './helpers';

import FileLoader from '@stackpress/lib/FileLoader';
import NodeFS from '@stackpress/lib/NodeFS';

import Builder from './Builder';
import Document from './Document';
import Manifest from './Manifest';
import Server from './Server';
import Exception from './Exception';

export { 
  Builder,
  Document, 
  Manifest, 
  Server, 
  Exception, 
  FileLoader, 
  NodeFS 
};

//node
import path from 'node:path';
//local
import type { UnknownNest } from '@stackpress/lib/types';
import type { 
  IM, SR,
  ViteConfig, 
  ServerConfig, 
  BuildResults,
  DocumentIterator 
} from './types';
import { 
  PAGE_TEMPLATE,
  CLIENT_TEMPLATE, 
  DOCUMENT_TEMPLATE 
} from './constants';

export default function engine(options: Partial<ServerConfig>) {
  const cwd = options.cwd || process.cwd();
  const config = {
    //path where to save assets (css, images, etc)
    // - used in build step
    assetPath: options.assetPath || path.join(cwd, '.reactus/assets'),
    //base path (used in vite)
    // - used in dev mode
    basePath: options.basePath || '/',
    //path where to save the client scripts (js)
    // - used in build step
    clientPath: options.clientPath || path.join(cwd, '.reactus/client'),
    //client script route prefix used in the document markup
    //ie. /client/[id][extname]
    //<script type="module" src="/client/[id][extname]"></script>
    //<script type="module" src="/client/abc123.tsx"></script>
    // - used in dev mode and live server
    clientRoute: options.clientRoute || '/client',
    //template wrapper for the client script (tsx)
    // - used in dev mode and build step
    clientTemplate: options.clientTemplate || CLIENT_TEMPLATE,
    //current working directory
    cwd: options.cwd || process.cwd(),
    //template wrapper for the document markup (html)
    // - used in dev mode and live server
    documentTemplate: options.documentTemplate || DOCUMENT_TEMPLATE,
    //file system
    fs: options.fs || new NodeFS(),
    //global head component path
    globalHead: options.globalHead,
    //global css file path
    globalCSS: options.globalCSS,
    //path where to save and load (live) the server script (js)
    // - used in build step and live server
    pagePath: options.pagePath || path.join(cwd, '.reactus/page'),
    //template wrapper for the page script (tsx)
    // - used in build step
    pageTemplate: options.pageTemplate || PAGE_TEMPLATE,
    //vite plugins
    plugins: options.plugins || [],
    //directs resolvers and markup generator
    production:  typeof options.production === 'boolean' 
      ? options.production 
      : true,
    //style route prefix used in the document markup
    //ie. /assets/[id][extname]
    //<link rel="stylesheet" type="text/css" href="/client/[id][extname]" />
    //<link rel="stylesheet" type="text/css" href="/assets/abc123.css" />
    // - used in live server
    styleRoute: options.styleRoute || '/assets',
    //original vite options (overrides other settings related to vite)
    vite: options.vite,
    //ignore files in watch mode
    // - used in dev mode
    watchIgnore: options.watchIgnore || []
  }
  const builder = new Builder(config);

  return {
    //----------------------------------------------------------------//
    // Settings

    //the final configuration
    config,
    //Returns the paths
    paths: builder.paths,
    //Returns true if production mode
    production: builder.production,
    //Returns the route prefixes
    routes: builder.routes,
    //Returns the templates
    templates: builder.templates,
    //Returns the vite configuration
    viteConfig: builder.viteConfig,

    /**
     * Returns the size of the manifest
     */
    get size() {
      return builder.size;
    },

    //----------------------------------------------------------------//
    // Class Instances

    builder,

    //----------------------------------------------------------------//
    // Server Methods

    /**
     * Tries to return the vite build callback
     */
    build: (config: ViteConfig) => builder.build(config),
  
    /**
     * Tries to return the vite dev server
     */
    dev: () => builder.dev(),

    /**
     * HTTP middleware
     */
    http: (req: IM, res: SR) => builder.http(req, res),

    /**
     * Returns the middleware stack
     */
    middlewares: () => builder.middlewares(),
  
    /**
     * Returns the default vite plugins
     */
    plugins: () => builder.plugins(),

    //----------------------------------------------------------------//
    // Manifest Methods

    /**
     * Create a new build
     */
    add: (entry: string) => builder.add(entry),

    /**
     * Builds and saves the assets used from all the documents
     */
    buildAssets: () => builder.buildAssets(),

    /**
     * Builds and saves the client entries from all the documents
     */
    buildClient: () => builder.buildClient(),

    /**
     * Builds and saves the pages scripts from all the documents
     */
    buildPages: () => builder.buildPages(),
  
    /**
     * Returns a list of map entries
     */
    entries: () => builder.entries(),

    /**
     * Find a build by id
     */
    find: (id: string) => builder.find(id),
  
    /**
     * Loop through the manifest
     */
    forEach: (callback: DocumentIterator<unknown>) =>  builder.forEach(callback),
  
    /**
     * Get a build by entry
     */
    get: (entry: string) => builder.get(entry),
  
    /**
     * Returns true if the build exists
     */
    has: (entry: string) => builder.has(entry),
  
    /**
     * Loads the manifest from disk
     */
    load: (file: string) =>  builder.load(file),
  
    /**
     * Loop through the manifest
     */
    map: <T = unknown>(callback: DocumentIterator<T>) => builder.map<T>(callback),
  
    /**
     * Saves the manifest to disk
     */
    save: (file: string) => builder.save(file),
  
    /**
     * Sets the manifest from hash
     */
    set: (hash: Record<string, string>) => builder.set(hash),
  
    /**
     * Converts the manifest to hash
     */
    toJSON: () => builder.toJSON(),
  
    /**
     * Returns a list of builds
     */
    values: () => builder.values(),

    //----------------------------------------------------------------//
    // Document Path Methods
  
    /**
     * Returns the absolute path to the entry file
     */
    absolute: (entry: string) => builder.add(entry).then(
      document => document.absolute()
    ),

    /**
     * Generates an id for the entry file
     */
    id: (entry: string) => builder.add(entry).then(
      document => document.id
    ),
  
    /**
     * Imports the page component to runtime
     */
    importPage: (entry: string) => builder.add(entry).then(
      document => document.importPage()
    ),
  
    /**
     * Returns the absolute path to the entry file
     */
    relative: (entry: string, fromFile: string) => builder.add(entry).then(
      document => document.relative(fromFile)
    ),

    //----------------------------------------------------------------//
    // Document Build Methods

    /**
     * Returns the final client entry 
     * source code (js) and assets
     */
    getAssets: (entry: string) => builder.add(entry).then(
      document => document.getAssets()
    ),

    /**
     * Returns the final client entry 
     * source code (js) and assets
     */
    getClient: (entry: string) => builder.add(entry).then(
      document => document.getClient()
    ),
  
    /**
     * Returns the final page component source code (js)
     */
    getPage: (
      entry: string, 
      assets?: BuildResults
    ) => builder.add(entry).then(
      document => document.getPage(assets)
    ),

    //----------------------------------------------------------------//
    // Document Server Methods
  
    /**
     * Returns the client entry for HMR (js)
     */
    getHMRClient: (entry: string) => builder.add(entry).then(
      document => document.getHMRClient()
    ),
    
    /**
     * Returns the final document markup (html)
     */
    getMarkup: (
      entry: string, 
      props: UnknownNest = {}
    ) => builder.add(entry).then(
      document => document.getMarkup(props)
    )
  };
}