//node
import fs from 'node:fs/promises';
import path from 'node:path';
//common
import type { DocumentIterator } from './types';
import Exception from './Exception';
import Document from './Document';
import Server from './Server';
import { writeFile } from './helpers';

export default class ServerManifest {
  //document map
  public readonly documents = new Map<string, Document>();
  //parent server
  protected _server: Server;

  /**
   * Returns the size of the manifest
   */
  public get size() {
    return this.documents.size;
  }

  /**
   * Sets the server parent
   */
  constructor(server: Server) {
    this._server = server;
  }

  /**
   * Create a new document
   */
  public async set(entry: string) {
    entry = await this._toEntryPath(entry);
    if (!(await this.has(entry))) {
      const document = new Document(entry, this._server);
      this.documents.set(entry, document);
    }
    return (await this.get(entry)) as Document;
  }

  /**
   * Returns a list of map entries
   */
  public entries() {
    return this.map<[ Document, number ]>((document, index) => [ document, index ]);
  }

  /**
   * Find a document by id
   */
  public find(id: string) {
    return this.values().find(document => document.id === id) ?? null;
  }

  /**
   * Loop through the manifest
   */
  public forEach(callback: DocumentIterator<unknown>) {
    this.values().forEach(callback);
  }

  /**
   * Get a document by entry
   */
  public async get(entry: string) {
    entry = await this._toEntryPath(entry);
    return this.values().find(document => document.entry === entry) ?? null;
  }

  /**
   * Returns true if the document exists
   */
  public async has(entry: string) {
    entry = await this._toEntryPath(entry);
    return (await this.get(entry)) !== null;
  }

  /**
   * Sets the manifest from hash
   */
  public load(hash: Record<string, string>) {
    for (const entry of Object.values(hash)) {
      this.set(entry);
    }
    return this;
  }

  /**
   * Loop through the manifest
   */
  public map<T = unknown>(callback: DocumentIterator<T>) {
    return this.values().map(callback);
  }

  /**
   * Loads the manifest from disk
   */
  public async open(file: string) {
    const json = await fs.readFile(file, 'utf8');
    const hash = JSON.parse(json) as Record<string, string>;
    return this.load(hash);
  }

  /**
   * Saves the manifest to disk
   */
  public async save(file: string) {
    const hash = this.toJSON();
    const json = JSON.stringify(hash, null, 2);
    await writeFile(file, json);
    return this;
  }

  /**
   * Converts the manifest to hash
   */
  public toJSON() {
    return Object.fromEntries(
      this.values().map(document => [ document.id, document.entry ])
    );
  }

  /**
   * Returns a list of documents
   */
  public values() {
    return Array.from(this.documents.values());
  }

  /**
   * Transforms entries to
   * - @/path/to/file
   * - module/path/to/file
   * Throws an Exception if the entry is invalid
   */
  protected async _toEntryPath(entry: string) {
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
    const loader = this._server.loader;
    //make it an absolute path
    entry = await loader.absolute(entry);
    //if the entry is a root of the project
    //ie. /path/to/project/file
    if (entry.startsWith(loader.cwd)) {
      //ie. @/file
      return entry.replace(loader.cwd, '@');
    }
    //it's not valid
    throw new Exception(`Invalid entry file: ${original}`);
  }
}