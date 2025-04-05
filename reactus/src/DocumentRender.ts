//stackpress
import type { UnknownNest } from '@stackpress/lib/types';
//common
import type Document from './Document';
import type Server from './Server';
import Exception from './Exception';
import { renderJSX } from './helpers';

export default class DocumentRender {
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
   * Returns the client entry for HMR (js)
   */
  async renderHMRClient() {
    const { resource, templates } = this._server;
    //for development and build modes
    const dev = await resource.dev();
    //get the client script template (tsx)
    const template = templates.client;
    //make in memory file string url
    const url = await this._renderVFS('hmr', template);
    //then let vite transform the file to js
    const results = await dev.transformRequest(url, { ssr: false });
    if (results === null) {
      throw Exception.for('File tsx to js transformation failed');
    }
    return results.code;
  }
  
  /**
   * Returns the final document markup (html)
   */
  async renderMarkup(props: UnknownNest = {}) {
    return this._server.production 
      ? await this._renderMarkup(props)
      : await this._renderDevMarkup(props);
  }

  /**
   * Returns the document markup for dev mode
   */
  protected async _renderDevMarkup(props: UnknownNest = {}) {
    const { id, loader } = this._document;
    const { resource, routes, templates } = this._server;
    //import the page
    const document = await loader.import();
    //get the document script template (tsx)
    const documentTemplate = templates.document;
    //for development and build modes
    const dev = await resource.dev();
    //determine the client route
    const clientRoute = `${routes.client}/${id}.tsx`;
    //add the following script tags to the document template
    // <script type="module">
    //   import RefreshRuntime from "/@react-refresh"
    //   RefreshRuntime.injectIntoGlobalHook(window)
    //   window.$RefreshReg$ = () => {}
    //   window.$RefreshSig$ = () => (type) => type
    //   window.__vite_plugin_react_preamble_installed__ = true
    // </script>
    // <script type="module" src="/@vite/client"></script>
    const html = await dev.transformIndexHtml('', documentTemplate);
    //render the body
    const body = renderJSX(document.default, props);
    //render the head
    const head = renderJSX(document.Head, props);
    //return the final html
    return html
      .replace(`<!--document-head-->`, head ?? '')
      .replace(`<!--document-body-->`, body ?? '')
      .replace(`<!--document-props-->`, JSON.stringify(props))
      .replace(`<!--document-client-->`, clientRoute);
  }

  /**
   * Returns the final document markup (html)
   */
  protected async _renderMarkup(props: UnknownNest = {}) {
    const { id, loader } = this._document;
    const { routes, templates } = this._server;
    //import the page
    const document = await loader.import();
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

  /**
   * Saves the document to disk and returns the vfs url
   */
  protected async _renderVFS(name: string, template: string) {
    const { vfs } = this._server;
    const { loader } = this._document;
    //get absolute file path
    const absolute = await loader.absolute();
    //calculate file path relative to the page file
    const file = `${absolute}.${name}.tsx`;
    //now make the entry file relative to the root entry file
    const relative = await loader.relative(file);
    //add the relative entry to the document script
    const code = template.replaceAll('{entry}', relative);
    //convert to VFS
    return vfs.set(file, code);
  }
}