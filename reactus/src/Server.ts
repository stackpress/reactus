//modules
import type { ViteDevServer, PluginOption } from 'vite';
//stackpress
import FileLoader from '@stackpress/lib/FileLoader';
import NodeFS from '@stackpress/lib/NodeFS';
//local
import type { IM, SR, ViteConfig, ServerConfig } from './types';
import Exception from './Exception';
import { imfs } from './helpers';

export default class Server {
  //file loader
  public readonly loader: FileLoader;
  //cached vite dev server
  protected _dev: ViteDevServer|null = null;
  //build paths
  protected _paths: {
    //path where to save assets (css, images, etc)
    asset: string,
    //location to where to put the final client scripts (js)
    client: string,
    //location to where to put the final page script (js)
    page: string
  };
  //route prefixes
  protected _routes: {
    //style route prefix used in the document markup
    style: string,
    //client route prefix used in the document markup
    client: string
  };
  //template wrappers for the client, document, and server
  protected _templates: {
    //template wrapper for the client script (tsx)
    client: string,
    //template wrapper for the document markup (html)
    document: string,
    //template wrapper for the page script (tsx)
    page: string
  };
  //configuration for vite
  protected _viteConfig?: ViteConfig;

  /**
   * Returns the paths
   */
  public get paths() {
    return Object.freeze(this._paths);
  }

  /**
   * Returns true if production mode
   */
  public get production() {
    return typeof this._viteConfig === 'undefined';
  }

  /**
   * Returns the routes
   */
  public get routes() {
    return Object.freeze(this._routes);
  }

  /**
   * Returns the templates
   */
  public get templates() {
    return Object.freeze(this._templates);
  }

  /**
   * Returns the vite configuration
   */
  public get viteConfig() {
    return this._viteConfig ? Object.freeze(this._viteConfig): null;
  }

  /**
   * Sets the templates and vite configuration
   */
  constructor(config: ServerConfig) {
    const { fs = new NodeFS(), cwd = process.cwd() } = config;
    this.loader = new FileLoader(fs, cwd);
    this._viteConfig = config.vite;

    //build paths
    this._routes = {
      //style route prefix used in the document markup
      style: config.styleRoute,
      //client route prefix used in the document markup
      client: config.clientRoute
    };
    //route paths
    this._paths = {
      //path where to save assets (css, images, etc)
      asset: config.assetPath,
      //location to where to put the final client scripts (js)
      client: config.clientPath,
      //location to where to put the final page script (js)
      page: config.pagePath
    };
    //template wrappers
    this._templates = {
      //template wrapper for the client script (tsx)
      client: config.clientTemplate,
      //template wrapper for the document markup (html)
      document: config.documentTemplate,
      //template wrapper for the page script (tsx)
      page: config.pageTemplate
    };
  }

  /**
   * Tries to return the vite build callback
   */
  public async build(config: ViteConfig) {
    //rely on import cache
    const { build } = await import('vite');
    //shallow copy the vite config
    const settings = { ...config }; 
    //organize plugins
    settings.plugins = await this.plugins(settings.plugins);
    //vite build now
    return build({ logLevel: 'silent', ...settings });
  }

  /**
   * Tries to return the vite dev server
   */
  public async dev() {
    if (!this._dev) {
      this._dev = await this._createServer();
    }
    return this._dev;
  }

  /**
   * HTTP middleware
   */
  public async http(req: IM, res: SR) {
    const middlewares = await this.middlewares();
    return await new Promise(r => middlewares(req, res, r));
  }

  /**
   * Returns the middleware stack
   */
  public async middlewares() {
    const dev = await this.dev();
    return dev.middlewares;
  }

  /**
   * Returns the default vite plugins
   */
  public async plugins(plugins: PluginOption[] = []) {
    //add react plugin
    const react = await import('@vitejs/plugin-react');
    //add the imfs plugin
    return [ imfs(), react.default(), ...plugins ];
  }

  /**
   * Create vite dev server logic
   */
  protected async _createServer() {
    if (!this._viteConfig) {
      throw Exception.for('Vite resource not found');
    }
    const { createServer } = await import('vite');
    //shallow copy the vite config
    const settings = { ...this._viteConfig }; 
    //organize plugins
    settings.plugins = await this.plugins(settings.plugins);
    //create the vite resource
    return await createServer(settings);
  }
}