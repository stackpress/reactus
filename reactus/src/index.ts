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

//local
import type { UnknownNest } from '@stackpress/lib/types';
import type { 
  IM, SR,
  ViteConfig, 
  DevelopConfig,
  BuildConfig,
  ProductionConfig,
  ServerConfig, 
  BuildResults,
  DocumentIterator 
} from './types';

export function dev(options: Partial<DevelopConfig>) {
  const config = Server.configure({ ...options, production: false });
  const manifest = new Manifest(config);

  return {
    //----------------------------------------------------------------//
    // Settings

    //the final configuration
    config,
    //Returns the paths
    paths: manifest.paths,
    //Returns the route prefixes
    routes: manifest.routes,
    //Returns the templates
    templates: manifest.templates,
    //Returns the vite configuration
    viteConfig: manifest.viteConfig,

    /**
     * Returns the size of the manifest
     */
    get size() {
      return manifest.size;
    },

    //----------------------------------------------------------------//
    // Class Instances

    manifest,

    //----------------------------------------------------------------//
    // Server Methods
  
    /**
     * Tries to return the vite dev server
     */
    dev: () => manifest.dev(),

    /**
     * HTTP middleware
     */
    http: (req: IM, res: SR) => manifest.http(req, res),

    /**
     * Returns the middleware stack
     */
    middlewares: () => manifest.middlewares(),
  
    /**
     * Returns the default vite plugins
     */
    plugins: () => manifest.plugins(),

    //----------------------------------------------------------------//
    // Manifest Methods

    /**
     * Create a new build
     */
    add: (entry: string) => manifest.add(entry),
  
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
    forEach: (callback: DocumentIterator<unknown>) => manifest.forEach(callback),
  
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
    // Document Path Methods
  
    /**
     * Returns the absolute path to the entry file
     */
    absolute: (entry: string) => manifest.add(entry).then(
      document => document.absolute()
    ),

    /**
     * Generates an id for the entry file
     */
    id: (entry: string) => manifest.add(entry).then(
      document => document.id
    ),
  
    /**
     * Imports the page component to runtime
     */
    importPage: (entry: string) => manifest.add(entry).then(
      document => document.importPage()
    ),

    //----------------------------------------------------------------//
    // Document Server Methods
  
    /**
     * Returns the client entry for HMR (js)
     */
    getHMRClient: (entry: string) => manifest.add(entry).then(
      document => document.getHMRClient()
    ),
    
    /**
     * Returns the final document markup (html)
     */
    getMarkup: (
      entry: string, 
      props: UnknownNest = {}
    ) => manifest.add(entry).then(
      document => document.getMarkup(props)
    )
  };
}

export function build(options: Partial<BuildConfig>) {
  const config = Server.configure({ ...options, production: false });
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
    )
  };
}

export function serve(options: Partial<ProductionConfig>) {
  const config = Server.configure({ ...options, production: true });
  const server = new Manifest(config);
  return {
    //----------------------------------------------------------------//
    // Settings

    //the final configuration
    config,
    //Returns the paths
    paths: server.paths,
    //Returns the route prefixes
    routes: server.routes,
    //Returns the templates
    templates: server.templates,

    //----------------------------------------------------------------//
    // Class Instances

    server,

    //----------------------------------------------------------------//
    // Document Path Methods
  
    /**
     * Returns the absolute path to the entry file
     */
    absolute: (entry: string) => server.add(entry).then(
      document => document.absolute()
    ),

    /**
     * Generates an id for the entry file
     */
    id: (entry: string) => server.add(entry).then(
      document => document.id
    ),
  
    /**
     * Imports the page component to runtime
     */
    importPage: (entry: string) => server.add(entry).then(
      document => document.importPage()
    ),

    //----------------------------------------------------------------//
    // Document Server Methods
    
    /**
     * Returns the final document markup (html)
     */
    getMarkup: (
      entry: string, 
      props: UnknownNest = {}
    ) => server.add(entry).then(
      document => document.getMarkup(props)
    )
  };
}

export default function engine(options: Partial<ServerConfig>) {
  const config = Server.configure(options);
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