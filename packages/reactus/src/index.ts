export type * from './types';

import FileEngine from './engines/FileEngine';
import ViteEngine from './engines/ViteEngine';
import Build from './Build';
import Exception from './Exception';
import Manifest from './Manifest';

export * from './helpers';

export { Build, Exception, Manifest, FileEngine, ViteEngine };

//node
import path from 'node:path';
//stackpress
import { type UnknownNest, NodeFS, FileLoader } from '@stackpress/lib';
//local
import type { 
  ReactusDevOptions, 
  ReactusLiveOptions,
  ApiHandlers
} from './types';
import { client, doc } from './helpers';

export function dev(options: ReactusDevOptions = {}) {
  const { fs = new NodeFS(), cwd = process.cwd() } = options;
  const loader = new FileLoader(fs, cwd);
  const {
    clientTemplate = client,
    documentTemplate = doc,
    clientPath = path.join(loader.cwd, 'public/client'),
    documentPath = path.join(loader.cwd, '.build/document'),
  } = options;
  const engine = new ViteEngine(loader, options.vite || {});
  const manifest = new Manifest(engine, loader, {
    clientPath,
    clientTemplate,
    documentPath,
    documentTemplate
  });

  return api(manifest) as unknown as ApiHandlers<ViteEngine>;
}

export function live(options: ReactusLiveOptions = {}) {
  const { fs = new NodeFS(), cwd = process.cwd() } = options;
  const loader = new FileLoader(fs, cwd);
  const {
    clientTemplate = client,
    documentTemplate = doc,
    clientPath = path.join(loader.cwd, 'public/client'),
    documentPath = path.join(loader.cwd, '.build/document'),
  } = options;
  const engine = new FileEngine(loader);
  const manifest = new Manifest(engine, loader, {
    clientPath,
    clientTemplate,
    documentPath,
    documentTemplate
  });

  return api(manifest) as unknown as ApiHandlers<FileEngine>;
}

export function api(manifest: Manifest) {
  const handlers = {
    manifest,
    engine: manifest.engine,
    loader: manifest.loader,
    path: manifest.path,
    template: manifest.template,
    builds: manifest.builds,

    /**
     * Returns true if the build is in development mode
     */
    get development() {
      return manifest.development;
    },
  
    /**
     * Determines the mode of the build
     */
    get mode() {
      return manifest.mode;
    },
  
    /**
     * Returns the size of the manifest
     */
    get size() {
      return manifest.size;
    },

    /**
     * Create a new build
     */
    add(entry: string) {
      return manifest.add(entry);
    },

    /**
     * Returns the client script
     */
    client(entry: string) {
      const build = handlers.add(entry);
      return build.client();
    },

    /**
     * Returns the document markup
     */
    document(entry: string, props: UnknownNest = {}) {
      const build = handlers.add(entry);
      return build.document(props);
    },
  
    /**
     * Returns a list of map entries
     */
    entries() {
      return manifest.entries();
    },

    /**
     * Find a build by id
     */
    find(id: string) {
      return manifest.find(id);
    },
  
    /**
     * Loop through the manifest
     */
    forEach(callback: (build: Build, index?: number) => unknown) {
      return manifest.forEach(callback);
    },
  
    /**
     * Get a build by entry
     */
    get(entry: string) {
      return manifest.get(entry);
    },

    /**
     * Loads a tsx (server) file in runtime
     */
    import<T = unknown>(entry: string) {
      const build = handlers.add(entry);
      return build.import<T>();
    },
  
    /**
     * Returns true if the build exists
     */
    has(entry: string) {
      return manifest.has(entry);
    },
  
    /**
     * Loads the manifest from disk
     */
    load(filename = 'manifest.json') {
      return manifest.load(filename);
    },
  
    /**
     * Loop through the manifest
     */
    map<T = unknown>(callback: (build: Build, index: number) => T) {
      return manifest.map<T>(callback);
    },

    /**
     * Vite tsx (server) renderer
     */
    render(entry: string, props: UnknownNest = {}) {
      const build = handlers.add(entry);
      return build.render(props);
    },
  
    /**
     * Saves the manifest to disk
     */
    save(filename = 'manifest.json') {
      return manifest.save(filename);
    },
  
    /**
     * Sets the manifest from hash
     */
    set(hash: Record<string, string>) {
      return manifest.set(hash);
    },
  
    /**
     * Converts the manifest to hash
     */
    toJSON() {
      return manifest.toJSON();
    },
  
    /**
     * Returns a list of builds
     */
    values() {
      return manifest.values();
    }
  };
  return handlers;
}