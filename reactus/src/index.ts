export type {
  BuildStatus,
  BuildResults,
  DocumentImport,
  DocumentIterator,
  IM, SR, Next,
  ViteConfig,
  DevelopConfig,
  BuildConfig,
  ProductionConfig,
  ServerConfig
} from './types.js';

export {
  VFS_PROTOCOL,
  VFS_RESOLVED,
  BASE62_ALPHABET,
  HASH_LENGTH,
  DOCUMENT_TEMPLATE,
  PAGE_TEMPLATE,
  CLIENT_TEMPLATE
} from './constants.js';

export {
  id,
  renderJSX,
  writeFile
} from './helpers.js';

export {
  css,
  file,
  hmr,
  vfs
} from './plugins.js';

import FileLoader from '@stackpress/lib/FileLoader';
import NodeFS from '@stackpress/lib/NodeFS';

import DocumentBuilder from './DocumentBuilder.js';
import DocumentLoader from './DocumentLoader.js';
import DocumentRender from './DocumentRender.js';

import ServerLoader from './ServerLoader.js';
import ServerManifest from './ServerManifest.js';
import ServerResource from './ServerResource.js';
import VirtualServer from './VirtualServer.js';

import Builder from './Builder.js';
import Document from './Document.js';
import Server from './Server.js';
import Exception from './Exception.js';

export { 
  DocumentBuilder,
  DocumentLoader,
  DocumentRender,
  ServerLoader,
  ServerManifest,
  ServerResource,
  VirtualServer,
  Builder,
  Document, 
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
} from './types.js';

export function dev(options: Partial<DevelopConfig>) {
  const config = Server.configure({ ...options, production: false });
  const server = new Server(config);

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
    //Returns the vite configuration
    viteConfig: server.resource.config,

    /**
     * Returns the size of the manifest
     */
    get size() {
      return server.manifest.size;
    },

    //----------------------------------------------------------------//
    // Class Instances

    server,
  
    //----------------------------------------------------------------//
    // Resource Methods
  
    /**
     * Tries to return the vite dev server
     */
    dev: () => server.resource.dev(),

    /**
     * HTTP middleware
     */
    http: (req: IM, res: SR) => server.http(req, res),

    /**
     * Returns the middleware stack
     */
    middlewares: () => server.resource.middlewares(),
  
    /**
     * Returns the default vite plugins
     */
    plugins: () => server.resource.plugins(),

    //----------------------------------------------------------------//
    // Manifest Methods
  
    /**
     * Returns a list of map entries
     */
    entries: () => server.manifest.entries(),

    /**
     * Find a build by id
     */
    find: (id: string) => server.manifest.find(id),
  
    /**
     * Loop through the manifest
     */
    forEach: (
      callback: DocumentIterator<unknown>
    ) =>  server.manifest.forEach(callback),
  
    /**
     * Get a build by entry
     */
    get: (entry: string) => server.manifest.get(entry),
  
    /**
     * Returns true if the build exists
     */
    has: (entry: string) => server.manifest.has(entry),
  
    /**
     * Sets the manifest from hash
     */
    load: (
      hash: Record<string, string>
    ) => server.manifest.load(hash),
  
    /**
     * Loads the manifest from disk
     */
    open: (file: string) =>  server.manifest.open(file),
  
    /**
     * Loop through the manifest
     */
    map: <T = unknown>(
      callback: DocumentIterator<T>
    ) => server.manifest.map<T>(callback),
  
    /**
     * Saves the manifest to disk
     */
    save: (file: string) => server.manifest.save(file),

    /**
     * Sets an entry in the manifest and returns a document
     */
    set: (entry: string) => server.manifest.set(entry),
  
    /**
     * Converts the manifest to hash
     */
    toJSON: () => server.manifest.toJSON(),
  
    /**
     * Returns a list of builds
     */
    values: () => server.manifest.values(),

    //----------------------------------------------------------------//
    // Document Path Methods
  
    /**
     * Returns the absolute path to the entry file
     */
    absolute: (entry: string) => server.manifest.set(entry).then(
      document => document.loader.absolute()
    ),

    /**
     * Generates an id for the entry file
     */
    id: (entry: string) => server.manifest.set(entry).then(
      document => document.id
    ),
  
    /**
     * Imports the page component to runtime
     */
    importPage: (entry: string) => server.manifest.set(entry).then(
      document => document.loader.import()
    ),

    //----------------------------------------------------------------//
    // Document Server Methods
  
    /**
     * Returns the client entry for HMR (js)
     */
    renderHMR: (entry: string) => server.manifest.set(entry).then(
      document => document.render.renderHMRClient()
    ),
    
    /**
     * Returns the final document markup (html)
     */
    render: (
      entry: string, 
      props: UnknownNest = {}
    ) => server.manifest.set(entry).then(
      document => document.render.renderMarkup(props)
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
    viteConfig: builder.resource.config,

    /**
     * Returns the size of the manifest
     */
    get size() {
      return builder.manifest.size;
    },

    //----------------------------------------------------------------//
    // Class Instances

    builder,

    //----------------------------------------------------------------//
    // Server Methods

    /**
     * Tries to return the vite build callback
     */
    build: (config: ViteConfig) => builder.resource.build(config),
  
    /**
     * Returns the default vite plugins
     */
    plugins: () => builder.resource.plugins(),

    //----------------------------------------------------------------//
    // Manifest Methods

    /**
     * Builds and saves the assets used from all the documents
     */
    buildAllAssets: () => builder.buildAssets(),

    /**
     * Builds and saves the client entries from all the documents
     */
    buildAllClients: () => builder.buildClients(),

    /**
     * Builds and saves the pages scripts from all the documents
     */
    buildAllPages: () => builder.buildPages(),
  
    /**
     * Returns a list of map entries
     */
    entries: () => builder.manifest.entries(),

    /**
     * Find a build by id
     */
    find: (id: string) => builder.manifest.find(id),
  
    /**
     * Loop through the manifest
     */
    forEach: (
      callback: DocumentIterator<unknown>
    ) =>  builder.manifest.forEach(callback),
  
    /**
     * Get a build by entry
     */
    get: (entry: string) => builder.manifest.get(entry),
  
    /**
     * Returns true if the build exists
     */
    has: (entry: string) => builder.manifest.has(entry),
  
    /**
     * Sets the manifest from hash
     */
    load: (
      hash: Record<string, string>
    ) => builder.manifest.load(hash),
  
    /**
     * Loads the manifest from disk
     */
    open: (file: string) =>  builder.manifest.open(file),
  
    /**
     * Loop through the manifest
     */
    map: <T = unknown>(
      callback: DocumentIterator<T>
    ) => builder.manifest.map<T>(callback),
  
    /**
     * Saves the manifest to disk
     */
    save: (file: string) => builder.manifest.save(file),

    /**
     * Sets an entry in the manifest and returns a document
     */
    set: (entry: string) => builder.manifest.set(entry),
  
    /**
     * Converts the manifest to hash
     */
    toJSON: () => builder.manifest.toJSON(),
  
    /**
     * Returns a list of builds
     */
    values: () => builder.manifest.values(),

    //----------------------------------------------------------------//
    // Document Path Methods
  
    /**
     * Returns the absolute path to the entry file
     */
    absolute: (entry: string) => builder.manifest.set(entry).then(
      document => document.loader.absolute()
    ),

    /**
     * Generates an id for the entry file
     */
    id: (entry: string) => builder.manifest.set(entry).then(
      document => document.id
    ),

    //----------------------------------------------------------------//
    // Document Build Methods

    /**
     * Returns the final client entry 
     * source code (js) and assets
     */
    buildAssets: (entry: string) => builder.manifest.set(entry).then(
      document => document.builder.buildAssets()
    ),

    /**
     * Returns the final client entry 
     * source code (js) and assets
     */
    buildClient: (entry: string) => builder.manifest.set(entry).then(
      document => document.builder.buildClient()
    ),
  
    /**
     * Returns the final page component source code (js)
     */
    buildPage: (
      entry: string, 
      assets?: BuildResults
    ) => builder.manifest.set(entry).then(
      document => document.builder.buildPage(assets)
    ),
  };
}

export function serve(options: Partial<ProductionConfig>) {
  const config = Server.configure({ ...options, production: true });
  const server = new Server(config);
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
    absolute: (entry: string) => server.manifest.set(entry).then(
      document => document.loader.absolute()
    ),

    /**
     * Generates an id for the entry file
     */
    id: (entry: string) => server.manifest.set(entry).then(
      document => document.id
    ),
  
    /**
     * Imports the page component to runtime
     */
    importPage: (entry: string) => server.manifest.set(entry).then(
      document => document.loader.import()
    ),

    //----------------------------------------------------------------//
    // Document Server Methods
    
    /**
     * Returns the final document markup (html)
     */
    render: async (
      entry: string, 
      props: UnknownNest = {}
    ) => server.manifest.set(entry).then(
      document => document.render.renderMarkup(props)
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
    viteConfig: builder.resource.config,

    /**
     * Returns the size of the manifest
     */
    get size() {
      return builder.manifest.size;
    },

    //----------------------------------------------------------------//
    // Class Instances

    builder,

    //----------------------------------------------------------------//
    // Resource Methods

    /**
     * Tries to return the vite build callback
     */
    build: (config: ViteConfig) => builder.resource.build(config),
  
    /**
     * Tries to return the vite dev server
     */
    dev: () => builder.resource.dev(),

    /**
     * HTTP middleware
     */
    http: (req: IM, res: SR) => builder.http(req, res),

    /**
     * Returns the middleware stack
     */
    middlewares: () => builder.resource.middlewares(),
  
    /**
     * Returns the default vite plugins
     */
    plugins: () => builder.resource.plugins(),

    //----------------------------------------------------------------//
    // Loader Methods

    /**
     * Imports a URL using the dev server
     */
    fetch: <T = any>(url: string) => builder.loader.fetch<T>(url),

    /**
     * Imports the page component to runtime for dev mode
     */
    import: <T = any>(
      pathname: string,
      extnames = [ '.js', '.tsx' ]
    ) => builder.loader.import<T>(pathname, extnames),

    /**
     * Returns the absolute filepath to the entry file
     * Throws an Exception if the file is not found
     */
    resolve: (
      pathname: string, 
      extnames = [ '.js', '.tsx' ]
    ) => builder.loader.resolve(pathname, extnames),

    //----------------------------------------------------------------//
    // Manifest Methods

    /**
     * Builds and saves the assets used from all the documents
     */
    buildAllAssets: () => builder.buildAssets(),

    /**
     * Builds and saves the client entries from all the documents
     */
    buildAllClients: () => builder.buildClients(),

    /**
     * Builds and saves the pages scripts from all the documents
     */
    buildAllPages: () => builder.buildPages(),
  
    /**
     * Returns a list of map entries
     */
    entries: () => builder.manifest.entries(),

    /**
     * Find a build by id
     */
    find: (id: string) => builder.manifest.find(id),
  
    /**
     * Loop through the manifest
     */
    forEach: (
      callback: DocumentIterator<unknown>
    ) =>  builder.manifest.forEach(callback),
  
    /**
     * Get a build by entry
     */
    get: (entry: string) => builder.manifest.get(entry),
  
    /**
     * Returns true if the build exists
     */
    has: (entry: string) => builder.manifest.has(entry),
  
    /**
     * Sets the manifest from hash
     */
    load: (
      hash: Record<string, string>
    ) => builder.manifest.load(hash),
  
    /**
     * Loads the manifest from disk
     */
    open: (file: string) =>  builder.manifest.open(file),
  
    /**
     * Loop through the manifest
     */
    map: <T = unknown>(
      callback: DocumentIterator<T>
    ) => builder.manifest.map<T>(callback),
  
    /**
     * Saves the manifest to disk
     */
    save: (file: string) => builder.manifest.save(file),

    /**
     * Sets an entry in the manifest and returns a document
     */
    set: (entry: string) => builder.manifest.set(entry),
  
    /**
     * Converts the manifest to hash
     */
    toJSON: () => builder.manifest.toJSON(),
  
    /**
     * Returns a list of builds
     */
    values: () => builder.manifest.values(),

    //----------------------------------------------------------------//
    // Document Path Methods
  
    /**
     * Returns the absolute path to the entry file
     */
    absolute: (entry: string) => builder.manifest.set(entry).then(
      document => document.loader.absolute()
    ),

    /**
     * Generates an id for the entry file
     */
    id: (entry: string) => builder.manifest.set(entry).then(
      document => document.id
    ),
  
    /**
     * Imports the page component to runtime
     */
    importPage: (entry: string) => builder.manifest.set(entry).then(
      document => document.loader.import()
    ),
  
    /**
     * Returns the absolute path to the entry file
     */
    relative: (entry: string, fromFile: string) => builder.manifest.set(entry).then(
      document => document.loader.relative(fromFile)
    ),

    //----------------------------------------------------------------//
    // Document Build Methods

    /**
     * Returns the final client entry 
     * source code (js) and assets
     */
    buildAssets: (entry: string) => builder.manifest.set(entry).then(
      document => document.builder.buildAssets()
    ),

    /**
     * Returns the final client entry 
     * source code (js) and assets
     */
    buildClient: (entry: string) => builder.manifest.set(entry).then(
      document => document.builder.buildClient()
    ),
  
    /**
     * Returns the final page component source code (js)
     */
    buildPage: (
      entry: string, 
      assets?: BuildResults
    ) => builder.manifest.set(entry).then(
      document => document.builder.buildPage(assets)
    ),

    //----------------------------------------------------------------//
    // Document Server Methods
  
    /**
     * Returns the client entry for HMR (js)
     */
    renderHMR: (entry: string) => builder.manifest.set(entry).then(
      document => document.render.renderHMRClient()
    ),
    
    /**
     * Returns the final document markup (html)
     */
    render: (
      entry: string, 
      props: UnknownNest = {}
    ) => builder.manifest.set(entry).then(
      document => document.render.renderMarkup(props)
    )
  };
}