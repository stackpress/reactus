//node
import path from 'node:path';
//common
import type { DocumentImport } from '../types';
import type Document from '../Document';
import type Server from '../Server';

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
    const { vfs, resource, loader, production } = this._server;
    //determine the page file name
    const meta = await loader.resolve(this._document.entry);
    if (production || meta.extname === '.js') {
      //use native import to load the module
      return await import(meta.filepath) as DocumentImport;
    }
    //for development and build modes
    const dev = await resource.dev();
    //check if tailwindcss is enabled
    if (!dev.config.plugins.find(
      plugin => plugin.name.startsWith('@tailwindcss/vite')
    )) {
      //use dev server to load the module
      return await loader.fetch<DocumentImport>(
        `file://${meta.filepath}`
      );
    }
    //tailwindcss is enabled, form an imfs instead
    //get the contents of the file with fs
    const fs = loader.fs;
    const relative = `./.tailwind/${this._document.id}.css`;
    let contents = await fs.readFile(meta.filepath, 'utf8');
    //add import css statement
    contents = `import '${relative}';\n${contents}`;
    //convert to data url
    const data = Buffer.from(contents).toString('base64');
    const url = vfs.set(meta.filepath, data);
    //use dev server to load the module
    return await loader.fetch<DocumentImport>(url);
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