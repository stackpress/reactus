//node
import fs from 'node:fs/promises';
import path from 'node:path';
//stackpress
import type { FileLoader } from '@stackpress/lib';
//engine
import FileEngine from './engines/FileEngine';
//local
import type { EngineInterface, ManifestOptions } from './types';
import Build from './Build';
import Exception from './Exception';

export default class Manifest {
  //engine
  public readonly engine: EngineInterface;
  //file loader options
  public readonly loader: FileLoader;
  //manifest map
  public readonly builds = new Set<Build>();
  //template strings
  protected _template: {
    client: string,
    document: string
  };
  //build paths
  protected _path: {
    client: string,
    document: string
  };
  
  /**
   * Returns true if the build is in development mode
   */
  public get development() {
    return this.mode !== 'production';
  }

  /**
   * Determines the mode of the build
   */
  public get mode() {
    return this.engine instanceof FileEngine 
      ? 'production'
      : 'development';
  }

  /**
   * Returns the build paths
   */
  public get path() {
    return Object.freeze(this._path);
  }

  /**
   * Returns the size of the manifest
   */
  public get size() {
    return this.builds.size;
  }

  /**
   * Returns the templates
   */
  public get template() {
    return Object.freeze(this._template);
  }

  /**
   * Set vite dev server
   */
  public constructor(
    engine: EngineInterface,
    loader: FileLoader,
    options: ManifestOptions
  ) {
    this.engine = engine;
    this.loader = loader;
    this._path = {
      client: options.clientPath,
      document: options.documentPath,
    }
    this._template = {
      client: options.clientTemplate,
      document: options.documentTemplate
    };
  }

  /**
   * Create a new build
   */
  public add(entry: string) {
    entry = this.toEntry(entry);
    if (!this.has(entry)) {
      const build = new Build(this, entry);
      this.builds.add(build);
    }
    return this.get(entry) as Build;
  }

  /**
   * Returns a list of map entries
   */
  public entries() {
    return this.map<[ Build, number ]>((build, index) => [ build, index ]);
  }

  /**
   * Find a build by id
   */
  public find(id: string) {
    return this.values().find(build => build.id === id) ?? null;
  }

  /**
   * Loop through the manifest
   */
  public forEach(callback: (build: Build, index?: number) => unknown) {
    this.values().forEach(callback);
  }

  /**
   * Get a build by entry
   */
  public get(entry: string) {
    entry = this.toEntry(entry);
    return this.values().find(build => build.entry === entry) ?? null;
  }

  /**
   * Returns true if the build exists
   */
  public has(entry: string) {
    entry = this.toEntry(entry);
    return this.get(entry) !== null;
  }

  /**
   * Loads the manifest from disk
   */
  public async load(filename = 'manifest.json') {
    const file = path.join(this.path.client, filename);
    const json = await fs.readFile(file, 'utf8');
    const hash = JSON.parse(json) as Record<string, string>;
    return this.set(hash);
  }

  /**
   * Loop through the manifest
   */
  public map<T = unknown>(callback: (build: Build, index: number) => T) {
    return this.values().map(callback);
  }

  /**
   * Saves the manifest to disk
   */
  public async save(filename = 'manifest.json') {
    const hash = this.toJSON();
    const json = JSON.stringify(hash, null, 2);
    const file = path.join(this.path.client, filename);
    await fs.writeFile(file, json);
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
      this.values().map(build => [ build.id, build.entry ])
    );
  }

  /**
   * Returns a list of builds
   */
  public values() {
    return Array.from(this.builds.values());
  }

  /**
   * Transforms entries to
   * - @/path/to/file
   * - module/path/to/file
   * Throws an Exception if the entry is invalid
   */
  protected toEntry(entry: string) {
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