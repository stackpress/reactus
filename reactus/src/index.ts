export type * from './types';
export * from './constants';
export * from './helpers';

import { FileLoader, NodeFS } from '@stackpress/lib';

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
//modules
import type { PluginOption } from 'vite';
//local
import type { 
  UnknownNest 
} from '@stackpress/lib/dist/types';
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
    cwd: options.cwd || process.cwd(),
    vite: options.vite,
    //path where to save assets (css, images, etc)
    assetPath: options.assetPath || path.join(cwd, '.reactus/assets'),
    //path where to save and load (live) the client scripts (js)
    clientPath: options.clientPath || path.join(cwd, '.reactus/client'),
    //client script route prefix used in the document markup
    //ie. /client/[id][extname]
    //<script type="module" src="/client/[id][extname]"></script>
    //<script type="module" src="/client/abc123.tsx"></script>
    clientRoute: options.clientRoute || '/client',
    //template wrapper for the client script (tsx)
    clientTemplate: options.clientTemplate || CLIENT_TEMPLATE,
    //template wrapper for the document markup (html)
    documentTemplate: options.documentTemplate || DOCUMENT_TEMPLATE,
    //path where to save and load (live) the server script (js)
    pagePath: options.pagePath || path.join(cwd, '.reactus/page'),
    //template wrapper for the page script (tsx)
    pageTemplate: options.pageTemplate || PAGE_TEMPLATE,
    //style route prefix used in the document markup
    //ie. /assets/[id][extname]
    //<link rel="stylesheet" type="text/css" href="/client/[id][extname]" />
    //<link rel="stylesheet" type="text/css" href="/assets/abc123.css" />
    styleRoute: options.styleRoute || '/assets'
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
    plugins: (plugins: PluginOption[] = []) => builder.plugins(plugins),

    //----------------------------------------------------------------//
    // Manifest Methods

    /**
     * Create a new build
     */
    add: (entry: string) => builder.add(entry),

    /**
     * Builds and saves the assets used from all the documents
     */
    buildAssets: (
      plugins: PluginOption[] = []
    ) => builder.buildAssets(plugins),

    /**
     * Builds and saves the client entries from all the documents
     */
    buildClient: (
      plugins: PluginOption[] = []
    ) => builder.buildClient(plugins),

    /**
     * Builds and saves the pages scripts from all the documents
     */
    buildPages: (
      plugins: PluginOption[] = []
    ) => builder.buildPages(plugins),
  
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
    // Document Methods

    /**
     * Returns the final client entry 
     * source code (js) and assets
     */
    getAssets: (
      entry: string, 
      plugins: PluginOption[] = []
    ) => builder.add(entry).getAssets(plugins),

    /**
     * Returns the final client entry 
     * source code (js) and assets
     */
    getClient: (
      entry: string, 
      plugins: PluginOption[] = []
    ) => builder.add(entry).getClient(plugins),
  
    /**
     * Returns the client entry for HMR (js)
     */
    getHMR: (entry: string) => builder.add(entry).getHMR(),
    
    /**
     * Returns the final document markup (html)
     */
    getMarkup: (
      entry: string, 
      props: UnknownNest = {}
    ) => builder.add(entry).getMarkup(props),
  
    /**
     * Returns the final page component source code (js)
     */
    getPage: (
      entry: string, 
      plugins: PluginOption[] = [],
      assets?: BuildResults
    ) => builder.add(entry).getPage(plugins, assets),

    /**
     * Generates an id for the entry file
     */
    id: (entry: string) => builder.add(entry).id,
  
    /**
     * Imports the page component to runtime
     */
    importPage: (entry: string) => builder.add(entry).importPage(),
  
    /**
     * Returns the absolute path to the entry file
     */
    source: (entry: string) => builder.add(entry).source,
  };
}