export type * from './types';
export * from './constants';
export * from './helpers';

import { FileLoader, NodeFS } from '@stackpress/lib';

import Document from './Document';
import Manifest from './Manifest';
import Server from './Server';
import Exception from './Exception';

export { 
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
  ViteConfig, 
  ServerConfig, 
  DocumentIterator 
} from './types';
import { 
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
    pagePath: options.pagePath || path.join(cwd, '.reactus/page')
  }
  const server = new Server(config);
  const manifest = new Manifest(server);

  return {
    //----------------------------------------------------------------//
    // Settings

    //the final configuration
    config,
    //Returns the paths
    paths: server.paths,
    //Returns true if production mode
    production: server.production,
    //Returns the templates
    templates: server.templates,
    //Returns the vite configuration
    viteConfig: server.viteConfig,

    /**
     * Returns the size of the manifest
     */
    get size() {
      return manifest.size;
    },

    //----------------------------------------------------------------//
    // Class Instances

    server,
    manifest,

    //----------------------------------------------------------------//
    // Server Methods

    /**
     * Tries to return the vite build callback
     */
    build: (config: ViteConfig) => server.build(config),
  
    /**
     * Tries to return the vite dev server
     */
    dev: () => server.dev(),

    //----------------------------------------------------------------//
    // Manifest Methods

    /**
     * Create a new build
     */
    add: (entry: string) => manifest.add(entry),

    /**
     * Builds and saves the assets used from all the documents
     */
    buildAssets: (
      plugins: PluginOption[] = []
    ) => manifest.buildAssets(plugins),

    /**
     * Builds and saves the client entries from all the documents
     */
    buildClient: (
      plugins: PluginOption[] = []
    ) => manifest.buildClient(plugins),

    /**
     * Builds and saves the pages scripts from all the documents
     */
    buildPages: (
      plugins: PluginOption[] = []
    ) => manifest.buildPages(plugins),
  
    /**
     * Returns a list of map entries
     */
    entries: () => manifest.entries(),

    /**
     * Find a build by id
     */
    find: (id: string) => manifest.find(id),
  
    /**
     * Loop through the manifest
     */
    forEach: (callback: DocumentIterator<unknown>) =>  manifest.forEach(callback),
  
    /**
     * Get a build by entry
     */
    get: (entry: string) => manifest.get(entry),
  
    /**
     * Returns true if the build exists
     */
    has: (entry: string) => manifest.has(entry),
  
    /**
     * Loads the manifest from disk
     */
    load: (file: string) =>  manifest.load(file),
  
    /**
     * Loop through the manifest
     */
    map: <T = unknown>(callback: DocumentIterator<T>) => manifest.map<T>(callback),
  
    /**
     * Saves the manifest to disk
     */
    save: (file: string) => manifest.save(file),
  
    /**
     * Sets the manifest from hash
     */
    set: (hash: Record<string, string>) => manifest.set(hash),
  
    /**
     * Converts the manifest to hash
     */
    toJSON: () => manifest.toJSON(),
  
    /**
     * Returns a list of builds
     */
    values: () => manifest.values(),

    //----------------------------------------------------------------//
    // Document Methods

    /**
     * Returns the final client entry 
     * source code (js) and assets
     */
    getAssets: (
      entry: string, 
      plugins: PluginOption[] = []
    ) => manifest.add(entry).getAssets(plugins),

    /**
     * Returns the final client entry 
     * source code (js) and assets
     */
    getClient: (
      entry: string, 
      plugins: PluginOption[] = []
    ) => manifest.add(entry).getClient(plugins),
  
    /**
     * Returns the client entry for HMR (js)
     */
    getHMR: (entry: string) => manifest.add(entry).getHMR(),
    
    /**
     * Returns the final document markup (html)
     */
    getMarkup: (
      entry: string, 
      props: UnknownNest = {}
    ) => manifest.add(entry).getMarkup(props),
  
    /**
     * Returns the final page component source code (js)
     */
    getPage: (
      entry: string, 
      plugins: PluginOption[] = []
    ) => manifest.add(entry).getPage(plugins),

    /**
     * Generates an id for the entry file
     */
    id: (entry: string) => manifest.add(entry).id,
  
    /**
     * Imports the page component to runtime
     */
    importPage: (entry: string) => manifest.add(entry).importPage(),
  
    /**
     * Returns the absolute path to the entry file
     */
    source: (entry: string) => manifest.add(entry).source,
  };
}