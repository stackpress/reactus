export type * from './types';

import Build from './Page';
import Exception from './Exception';
import Manifest from './Manifest';

export * from './helpers';

export { Build, Exception, Manifest };

//node
import path from 'node:path';
//stackpress
import { type UnknownNest, NodeFS, FileLoader } from '@stackpress/lib';
//local
import type { 
  BuildMode, 
  ReactusOptions,
  ForEachCallback,
  MapCallback
} from './types';
import { 
  PAGE_TEMPLATE,
  CLIENT_TEMPLATE, 
  DOCUMENT_TEMPLATE 
} from './helpers';

export default function reactus(mode: BuildMode, options: ReactusOptions = {}) {
  const { fs = new NodeFS(), cwd = process.cwd() } = options;
  const loader = new FileLoader(fs, cwd);

  const { 
    //callback to lazily connect to vite dev server
    connect = async () => null,
    //location to where to put the final client scripts (js)
    clientBuildPath = path.join(loader.cwd, '.reactus/build/client'),
    //client script route prefix used in the document markup
    //ie. /client/[id][extname]
    //<script type="module" src="/client/[id][extname]"></script>
    //<script type="module" src="/client/abc123.tsx"></script>
    clientRoute = '/client',
    //location to where to put the client scripts for dev and build (tsx)
    clientSourcePath = path.join(loader.cwd, '.reactus/src/client'),
    //template wrapper for the client script (tsx)
    clientTemplate = CLIENT_TEMPLATE,
    //template wrapper for the document markup (html)
    documentTemplate = DOCUMENT_TEMPLATE,
    //location to where to put the manifest file (json)
    manifestPath = path.join(loader.cwd, '.reactus/manifest.json'),
    //location to where to put the final page entry (js)
    pageBuildPath = path.join(loader.cwd, '.reactus/build/page'),
    //location to where to put the page scripts for build (tsx)
    pageSourcePath = path.join(loader.cwd, '.reactus/src/page'),
    //template wrapper for the page script (tsx)
    pageTemplate = PAGE_TEMPLATE
  } = options;

  const manifest = new Manifest(mode, loader, {
    connect,
    clientBuildPath,
    clientRoute,
    clientSourcePath,
    clientTemplate,
    documentTemplate,
    manifestPath,
    pageBuildPath,
    pageSourcePath,
    pageTemplate
  });

  const handlers = {
    //----------------------------------------------------------------//
    // Class Instances

    manifest,
    loader,

    //----------------------------------------------------------------//
    // Manifest Settings

    connect: manifest.connect,
    file: manifest.manifest,
    mode: manifest.mode,
    pages: manifest.pages,
    path: manifest.path,
    template: manifest.template,

    //----------------------------------------------------------------//
    // Manifest Getters
  
    /**
     * Returns the size of the manifest
     */
    get size() {
      return manifest.size;
    },

    //----------------------------------------------------------------//
    // Manifest Methods

    /**
     * Create a new build
     */
    add: (entry: string) => manifest.add(entry),

    /**
     * Builds all the client scripts (js) from the pages in the manifest
     */
    buildClient: () => manifest.buildClient(),

    /**
     * Builds all the pages (js) from the pages in the manifest
     */
    buildPages: () => manifest.buildPages(),
  
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
    forEach: (callback: ForEachCallback) =>  manifest.forEach(callback),
  
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
    load: () =>  manifest.load(),
  
    /**
     * Loop through the manifest
     */
    map: <T = unknown>(callback: MapCallback<T>) => manifest.map<T>(callback),

    /**
     * Tries to return the vite dev resource
     */
    resource: () => manifest.resource(),
  
    /**
     * Saves the manifest to disk
     */
    save: () => manifest.save(),
  
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
    // Build Methods

    /**
     * Returns the final client source code (js)
     */
    getClientBuild(entry: string) {
      return manifest.add(entry).getClientBuild();
    },
  
    /**
     * Returns the client source code (tsx)
     */
    getClientSource(entry: string) {
      return manifest.add(entry).getClientSource();
    },
  
    /**
     * Returns the document markup (html)
     */
    getMarkup(entry: string) {
      return manifest.add(entry).getMarkup();
    },
  
    /**
     * Returns the final page source code (js)
     */
    getPageBuild(entry: string) {
      return manifest.add(entry).getPageBuild();
    },

    /**
     * Generates an id for the entry file
     */
    id(entry: string) {
      return manifest.add(entry).id;
    },
  
    /**
     * Loads the page source in runtime (node)
     */
    loadPage(entry: string) {
      return manifest.add(entry).loadPage();
    },
  
    /**
     * Compiles and saves the final client source code (js)
     */
    saveClientBuild(entry: string) {
      return manifest.add(entry).saveClientBuild();
    },
  
    /**
     * Compiles and saves the client source code (tsx)
     */
    saveClientSource(entry: string) {
      return manifest.add(entry).saveClientSource();
    },
  
    /**
     * Compiles and saves the final page source code (js)
     */
    savePageBuild(entry: string) {
      return manifest.add(entry).savePageBuild();
    },
  
    /**
     * Compiles and saves the page markup code (html)
     */
    saveMarkup(
      entry: string, 
      destination: string, 
      props: UnknownNest = {}
    ) {
      return manifest.add(entry).saveMarkup(destination, props);
    }
  };
  return handlers;
}