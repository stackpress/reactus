//node
import path from 'node:path';
//stackpress
import type { UnknownNest } from '@stackpress/lib/types';
//document
import type { DocumentImport } from './types';
//local
import type Server from './Server';
import { id, renderJSX } from './helpers';

export default class Document {
  //server parent
  public readonly server: Server;
  //entry file formats
  // - @/path/to/file
  // - module/path/to/file
  public readonly entry: string;

  /**
   * Generates an id for the entry file
   */
  public get id() {
    const hash = id(this.entry, 8)
    const basename = path.basename(this.entry);
    return `${basename}-${hash}`;
  }

  /**
   * Sets the manifest and entry file
   */
  public constructor(entry: string, server: Server) {
    this.entry = entry;
    this.server = server;
  }

  /**
   * Imports the page component to runtime
   */
  public async import(): Promise<DocumentImport> {
    //get the page path
    const pagePath = this.server.paths.page;
    //determine the page file name
    const filepath = path.join(pagePath, `${this.id}.js`);
    //use native import to load the module
    return await this.server.import<DocumentImport>(filepath);
  }

  /**
   * Returns the final document markup (html)
   */
  async renderMarkup(props: UnknownNest = {}) {
    const { routes, templates } = this.server;
    //import the page
    const document = await this.import();
    //get the document script template (tsx)
    const documentTemplate = templates.document;
    //determine the client route
    const clientRoute = `${routes.client}/${id}.js`;
    //determine style routes
    const cssRoutes = (document.styles || []).map(
      style => `${routes.css}/${style}`
    );
    //render the body
    const body = renderJSX(document.default, props);
    //render the head
    const head = renderJSX(document.Head, { 
      ...props, 
      styles: cssRoutes
    });
    //return the final html
    return documentTemplate
      .replace(`<!--document-head-->`, head ?? '')
      .replace(`<!--document-body-->`, body ?? '')
      .replace(`<!--document-props-->`, JSON.stringify(props))
      .replace(`<!--document-client-->`, clientRoute);
  }
}