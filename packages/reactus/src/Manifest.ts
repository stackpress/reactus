//node
import fs from 'node:fs/promises';
import path from 'node:path';
//modules
import type { PluginOption } from 'vite';
//local
import type { DocumentIterator, BuildStatus } from './types';
import type Server from './Server';
import Document from './Document';
import Exception from './Exception';
import { writeFile } from './helpers';

export default class Manifest {
  //file server
  public readonly server: Server;
  //document map
  public readonly documents = new Set<Document>();

  /**
   * Returns the size of the manifest
   */
  public get size() {
    return this.documents.size;
  }

  /**
   * Sets the file loader
   */
  public constructor(server: Server) {
    this.server = server;
  }

  /**
   * Create a new document
   */
  public add(entry: string) {
    entry = this._toEntryPath(entry);
    if (!this.has(entry)) {
      const document = new Document(entry, this.server);
      this.documents.add(document);
    }
    return this.get(entry) as Document;
  }

  /**
   * Builds and saves the client entries from all the documents
   */
  public async buildClient(plugins: PluginOption[] = []) {
    //buffer for the build status results
    const results: BuildStatus[] = [];
    //loop through all the documents
    for (const document of this.values()) {
      //this just gives the entry code (js) (chunk)
      const client = await document.getClient(plugins);
      //if the output is not an array
      if (!Array.isArray(client.output)) {
        //push an error
        results.push(Exception.for(
          `Client '${document.entry}' was not generated`
        ).withCode(500).toResponse());
        //do not do anything else
        continue;
      }
      //find the output with type chunk
      const chunk = client.output.find(
        output => output.type === 'chunk'
      );
      //if a chunk was not found
      if (!chunk) {
        //push an error
        results.push(Exception.for(
          `Client '${document.entry}' was not generated`
        ).withCode(404).toResponse());
        //skip the rest...
        continue;
      }
      //determine the file path
      const file = path.join(
        this.server.paths.client, 
        `${document.id}.js`
      );
      //write the file to disk
      await writeFile(file, chunk.code);
      //push the result
      results.push({
        code: 200,
        status: 'OK',
        results: {
          type: 'client',
          id: document.id,
          entry: document.entry,
          contents: chunk.code,
          source: this.server.loader.absolute(document.entry),
          destination: file
        }
      });
    }
    //return the results
    return results;
  }

  /**
   * Builds and saves the pages scripts from all the documents
   */
  public async buildPages(plugins: PluginOption[] = []) {
    //buffer for the build status results
    const results: BuildStatus[] = [];
    //loop through all the documents
    for (const document of this.values()) {
      //this gives the page component source code (js) and assets
      const page = await document.getPage(plugins);
      //if the output is not an array
      if (!Array.isArray(page.output)) {
        //push an error
        results.push(Exception.for(
          `Page '${document.entry}' was not generated`
        ).withCode(500).toResponse());
        //dont do anything else
        continue;
      }
      //find the output with type chunk
      const chunk = page.output.find(
        output => output.type === 'chunk'
      );
      //if a chunk was not found
      if (!chunk) {
        //push an error
        results.push(Exception.for(
          `Page '${document.entry}' was not generated`
        ).withCode(404).toResponse());
        //skip the rest...
        continue;
      }
      //determine the file path
      const file = path.join(
        this.server.paths.page, 
        `${document.id}.js`
      );
      //write the file to disk
      await writeFile(file, chunk.code);
      //push the result
      results.push({
        code: 200,
        status: 'OK',
        results: {
          type: 'page',
          id: document.id,
          entry: document.entry,
          contents: chunk.code,
          source: this.server.loader.absolute(document.entry),
          destination: file
        }
      });
    }
    //return the results
    return results;
  }

  /**
   * Builds and saves the assets used from all the documents
   */
  public async buildAssets(plugins: PluginOption[] = []) {
    //buffer for the build status results
    const results: BuildStatus[] = [];
    //loop through all the documents
    for (const document of this.values()) {
      //this gives the page component source code (js) and assets
      const page = await document.getAssets(plugins);
      //if the output is not an array
      if (!Array.isArray(page.output)) {
        //push an error
        results.push(Exception.for(
          `Assets for '${document.entry}' was not generated`
        ).withCode(500).toResponse());
        //dont do anything else
        continue;
      }
      //loop through all the outputs
      for (const output of page.output) {
        //if the output is not an asset
        if (output.type !== 'asset') continue;
        //if output does not start with assets/
        if (!output.fileName.startsWith('assets/')) {
          //push an error
          results.push(Exception.for(
            `${output.type} '${output.fileName}' was not saved`
          ).withCode(404).toResponse());
          continue;
        }
        //determine the file path
        const file = path.join(
          this.server.paths.asset, 
          output.fileName.substring(7)
        );
        //write the file to disk
        await writeFile(file, output.source);
        //push the result
        results.push({
          code: 200,
          status: 'OK',
          results: {
            type: 'asset',
            id: document.id,
            entry: document.entry,
            contents: output.source,
            destination: file
          }
        });
      }
    }
    return results;
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
  public get(entry: string) {
    entry = this._toEntryPath(entry);
    return this.values().find(document => document.entry === entry) ?? null;
  }

  /**
   * Returns true if the document exists
   */
  public has(entry: string) {
    entry = this._toEntryPath(entry);
    return this.get(entry) !== null;
  }

  /**
   * Loads the manifest from disk
   */
  public async load(file: string) {
    const json = await fs.readFile(file, 'utf8');
    const hash = JSON.parse(json) as Record<string, string>;
    return this.set(hash);
  }

  /**
   * Loop through the manifest
   */
  public map<T = unknown>(callback: DocumentIterator<T>) {
    return this.values().map(callback);
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
    entry = this.server.loader.absolute(entry);
    //if the entry is a root of the project
    //ie. /path/to/project/file
    if (entry.startsWith(this.server.loader.cwd)) {
      //ie. @/file
      return entry.replace(this.server.loader.cwd, '@');
    }
    //it's not valid
    throw new Exception(`Invalid entry file: ${original}`);
  }
}