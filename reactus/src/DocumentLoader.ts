//node
import path from 'node:path';
//common
import type { DocumentImport } from './types';
import type Document from './Document';
import type Server from './Server';

export default class DocumentLoader {
  //parent docment
  protected _document: Document;
  //parent server
  protected _server: Server;

  /**
   * Sets the parent document
   */
  public constructor(document: Document) {
    this._document = document;
    this._server = document.server;
  }

  /**
   * Returns the absolute path to the entry file
   */
  public async absolute() {
    const loader = this._server.loader;
    return await loader.absolute(this._document.entry);
  }

  /**
   * Imports the page component to runtime
   */
  public async import() {
    const { loader, production } = this._server;
    if (production) {
      //get the page path
      const pagePath = this._server.paths.page;
      //determine the page file name
      const filepath = path.join(pagePath, `${this._document.id}.js`);
      //use native import to load the module
      return await loader.import<DocumentImport>(filepath);
    }
    //determine the page file name
    const { filepath } = await loader.resolve(
      this._document.entry
    );
    //use dev server to load the module
    return await loader.fetch<DocumentImport>(
      `file://${filepath}`
    );
  }

  /**
   * Changes the entry path to a relative file path
   * 
   * Entry path formats:
   * - @/path/to/file
   * - module/path/to/file
   */
  public async relative(fromFile: string) {
    if (this._document.entry.startsWith(`@${path.sep}`)) {
      const absolute = await this.absolute();
      return this._server.loader.relative(fromFile, absolute);
    }
    return this._document.entry;
  }
}