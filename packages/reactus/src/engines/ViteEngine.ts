//modules
import type { ViteDevServer, InlineConfig } from 'vite';
import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { jsx } from 'react/jsx-runtime';
//stackpress
import type { UnknownNest, FileLoader } from '@stackpress/lib';
//root
import type { 
  PageImport, 
  EngineInterface, 
  ViteEngineConfig 
} from '../types';
import { isHash } from '../helpers';

export default class ViteEngine implements EngineInterface {
  //file loader
  protected _loader: FileLoader;
  //vite configuration
  protected _config: InlineConfig;
  //vite dev server
  protected _resource?: ViteDevServer;

  /**
   * Remember the Vite configuration
   */
  public constructor(loader: FileLoader, config: ViteEngineConfig) {
    this._loader = loader;
    if (isHash(config)) {
      this._config = config as InlineConfig;
    } else {
      this._resource = config as ViteDevServer;
      this._config = {};
    }
  }

  /**
   * Lazily returns the Vite dev server
   */
  public async connection() {
    if (!this._resource) {
      const { createServer } = await import('vite');
      this._resource = await createServer(this._config);
    }
    return this._resource;
  }
  
  /**
   * Returns the client script
   */
  public async getClientScript(url: string) {
    //fix url
    url = this.toFileUrl(url, '.tsx');
    //get the resource
    const resource = await this.connection();
    //then let vite transform the file to js
    const results = await resource.transformRequest(url, { ssr: false });
    return results?.code ?? null;
  }
  
  /**
   * Returns the document markup
   */
  public async getDocumentMarkup(
    url: string, 
    clientScriptRoute: string, 
    documentTemplate: string,
    props: UnknownNest = {}
  ) {
    //fix url
    url = this.toFileUrl(url, '.tsx');
    //get the resource
    const resource = await this.connection();
    //import the page
    const page = await resource.ssrLoadModule(url) as PageImport;
    //organize the markup elements
    const elements = {
      head: page.Head ? renderToString(
        jsx(StrictMode, { children: jsx(page.Head, props) })
      ): undefined,
      body: renderToString(
        jsx(StrictMode, { children: jsx(page.default, props) })
      )
    };
    //add the following script tags to the document template
    // <script type="module">
    //   import RefreshRuntime from "/@react-refresh"
    //   RefreshRuntime.injectIntoGlobalHook(window)
    //   window.$RefreshReg$ = () => {}
    //   window.$RefreshSig$ = () => (type) => type
    //   window.__vite_plugin_react_preamble_installed__ = true
    // </script>
    // <script type="module" src="/@vite/client"></script>
    const html = await resource.transformIndexHtml('', documentTemplate);
    //return the final html
    return html
      .replace(`<!--page-head-->`, elements.head ?? '')
      .replace(`<!--page-body-->`, elements.body ?? '')
      .replace(`<!--page-client-->`, clientScriptRoute);
  }
  
  /**
   * Loads a tsx (server) file in runtime
   */
  public async import<T = unknown>(url: string) {
    //fix url
    url = this.toFileUrl(url);
    const resource = await this.connection();
    return (await resource.ssrLoadModule(url)) as T;
  }

  /**
   * Vite tsx (server) renderer
   */
  public async render(url: string, props: UnknownNest = {}) {
    //fix url
    url = this.toFileUrl(url, '.tsx');
    const page = await this.import<PageImport>(url);
    return {
      head: page.Head ? renderToString(
        jsx(StrictMode, { children: jsx(page.Head, props) })
      ): undefined,
      body: renderToString(
        jsx(StrictMode, { children: jsx(page.default, props) })
      )
    };
  }

  /**
   * Formats the following to url
   * - @/path/to/file
   * - module/path/to/file
   */
  protected toFileUrl(file: string, extname?: string) {
    //make it asolute
    file = this._loader.absolute(file);
    //make it url
    let url = `file://${this._loader.absolute(file)}`;
    //if the url doesn't have the extension
    if (typeof extname === 'string' 
      && extname.length > 0 
      && !url.endsWith(extname)
    ) {
      //add the extension
      url = `${url}${extname}`;
    }
    //return the url
    return url;
  }
}