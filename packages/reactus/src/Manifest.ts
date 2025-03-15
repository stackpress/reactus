//node
import fs from 'node:fs/promises';
import path from 'node:path';
//modules
import type { ViteDevServer } from 'vite';
//stackpress
import type { FileLoader } from '@stackpress/lib';
//local
import type { BuildMode, ViteConnect, ManifestOptions } from './types';
import Page from './Page';
import Exception from './Exception';

export default class Manifest {
  //callback to lazily connect to vite dev server
  public readonly connect: ViteConnect;
  //file loader options
  public readonly loader: FileLoader;
  //location to where to put the manifest file (json)
  public readonly manifest: string;
  //page map
  public readonly pages = new Set<Page>();
  //client script route prefix used in the document markup
  //ie. /client/[id][extname]
  //<script type="module" src="/client/[id][extname]"></script>
  //<script type="module" src="/client/abc123.tsx"></script>
  public readonly route: string;
  //page processing mode
  public readonly mode: BuildMode;
  //cached vite resource
  protected _resource: ViteDevServer|null = null;
  //build paths
  protected _path: {
    //location to where to put the final client scripts (js)
    client: string,
    //location to where to put the final page entry (js)
    page: string,
    //location to where to put the client scripts for dev and build (tsx)
    src: string
  };
  //static templates
  protected _template: {
    //template wrapper for the client script (tsx)
    client: string,
    //template wrapper for the document markup (html)
    document: string,
    //template wrapper for the page script (tsx)
    pageTemplate: string
  };

  /**
   * Returns all the build paths
   */
  public get path() {
    return Object.freeze(this._path);
  }

  /**
   * Returns the size of the manifest
   */
  public get size() {
    return this.pages.size;
  }

  /**
   * Returns all the static templates
   */
  public get template() {
    return Object.freeze(this._template);
  }

  /**
   * Consume all the options
   */
  public constructor(
    mode: BuildMode,
    loader: FileLoader,
    options: ManifestOptions
  ) {
    this.mode = mode;
    this.loader = loader;
    this.connect = options.connect;
    //location to where to put the manifest file (json)
    this.manifest = options.manifestPath;
    //client script route prefix used in the document markup
    //ie. /client/[id][extname]
    //<script type="module" src="/client/[id][extname]"></script>
    //<script type="module" src="/client/abc123.tsx"></script>
    this.route = options.clientRoute;
    //build paths
    this._path = {
      //location to where to put the final client scripts (js)
      client: options.clientPath,
      //location to where to put the final page entry (js)
      page: options.pagePath,
      //location to where to put the client scripts for dev and build (tsx)
      src: options.sourcePath
    };
    //static templates
    this._template = {
      //template wrapper for the client script (tsx)
      client: options.clientTemplate,
      //template wrapper for the document markup (html)
      document: options.documentTemplate,
      //template wrapper for the page script (tsx)
      pageTemplate: options.pageTemplate
    };
  }

  /**
   * Create a new page
   */
  public add(entry: string) {
    entry = this._toEntryPath(entry);
    if (!this.has(entry)) {
      const page = new Page(this, entry);
      this.pages.add(page);
    }
    return this.get(entry) as Page;
  }

  /**
   * Builds all the client scripts (js) from the pages in the manifest
   */
  public async buildClient() {
    const results: Record<string, string> = {};
    for (const page of this.values()) {
      results[page.id] = await page.saveClient();
    }
    return results;
  }

  /**
   * Builds all the page scripts (js) from the pages in the manifest
   */
  public async buildPages() {
    const results: Record<string, string> = {};
    for (const page of this.values()) {
      results[page.id] = await page.savePage();
    }
    return results;
  }

  /**
   * Returns a list of map entries
   */
  public entries() {
    return this.map<[ Page, number ]>((page, index) => [ page, index ]);
  }

  /**
   * Find a page by id
   */
  public find(id: string) {
    return this.values().find(page => page.id === id) ?? null;
  }

  /**
   * Loop through the manifest
   */
  public forEach(callback: (page: Page, index?: number) => unknown) {
    this.values().forEach(callback);
  }

  /**
   * Get a page by entry
   */
  public get(entry: string) {
    entry = this._toEntryPath(entry);
    return this.values().find(page => page.entry === entry) ?? null;
  }

  /**
   * Returns true if the page exists
   */
  public has(entry: string) {
    entry = this._toEntryPath(entry);
    return this.get(entry) !== null;
  }

  /**
   * Loads the manifest from disk
   */
  public async load() {
    const json = await fs.readFile(this.manifest, 'utf8');
    const hash = JSON.parse(json) as Record<string, string>;
    return this.set(hash);
  }

  /**
   * Loop through the manifest
   */
  public map<T = unknown>(callback: (page: Page, index: number) => T) {
    return this.values().map(callback);
  }

  /**
   * Tries to return the vite resource
   */
  public async resource() {
    if (!this._resource) {
      this._resource = (await this.connect()) ?? null;
    }
    return this._resource;
  }

  /**
   * Saves the manifest to disk
   */
  public async save() {
    const hash = this.toJSON();
    const json = JSON.stringify(hash, null, 2);
    await fs.writeFile(this.manifest, json);
    return this;
  }

  /**
   * Sets the manifest from hash
   */
  public set(hash: Record<string, string>) {
    for (const entry of Object.values(hash)) {
      this.add(entry);
    }
    return this;
  }

  /**
   * Converts the manifest to hash
   */
  public toJSON() {
    return Object.fromEntries(
      this.values().map(page => [ page.id, page.entry ])
    );
  }

  /**
   * Returns a list of pages
   */
  public values() {
    return Array.from(this.pages.values());
  }

  /**
   * Transforms entries to
   * - @/path/to/file
   * - module/path/to/file
   * Throws an Exception if the entry is invalid
   */
  protected _toEntryPath(entry: string) {
    const original = entry;
    //get last position of node_modules
    //ie. /path/to/node_modules/to/node_modules/module
    const moduleIndex = entry.lastIndexOf('node_modules/');
    if (moduleIndex >= 0) {
      //remove everything before node_modules
      //ie. module
      entry = entry.substring(moduleIndex + 13);
    }
    if (!entry.startsWith(path.sep) 
      && !entry.startsWith(`.${path.sep}`) 
      && !entry.startsWith(`..${path.sep}`)
    ) {
      return entry;
    }
    //if the entry is a url
    //ie. file:///path/to/file
    if (entry.startsWith('file://')) {
      //dont make it a url
      //ie. /path/to/file
      entry = entry.slice(7);
    }
    //if the entry is a project path ie. @/file
    if (entry.startsWith(`@${path.sep}`)) {
      return entry;
    }
    //make it an absolute path
    entry = this.loader.absolute(entry);
    //if the entry is a root of the project
    //ie. /path/to/project/file
    if (entry.startsWith(this.loader.cwd)) {
      //ie. @/file
      return entry.replace(this.loader.cwd, '@');
    }
    //it's not valid
    throw new Exception(`Invalid entry file: ${original}`);
  }
}