//node
import path from 'node:path';
//modules
import type { ElementType } from 'react';
import type { ViteDevServer, PluginOption } from 'vite';
//stackpress
import FileLoader from '@stackpress/lib/FileLoader';
import NodeFS from '@stackpress/lib/NodeFS';
//local
import type { IM, SR, ViteConfig, ServerConfig } from './types';
import Exception from './Exception';
import { imfs, loader } from './helpers';

export default class Server {
  //file loader
  public readonly loader: FileLoader;
  //directs resolvers and markup generator
  public readonly production: boolean;
  //vite plugins
  protected _plugins: PluginOption[];
  //cached vite dev server
  protected _dev: ViteDevServer|null = null;
  //global components and styles
  protected _globals: {
    //global head component
    head?: ElementType|null,
    //global styles
    styles?: string|null
  } = {};
  //watch ignore patterns
  protected _ignore: string[];
  //build paths
  protected _paths: {
    //path where to save assets (css, images, etc)
    asset: string,
    //base path (used in vite)
    base: string,
    //location to where to put the final client scripts (js)
    client: string,
    //global css file path
    css?: string
    //global head component path
    head?: string,
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
    this.production = config.production;
    this._plugins = config.plugins;
    this._viteConfig = config.vite;
    //watch ignore patterns
    this._ignore = config.watchIgnore || [];
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
      //base path (used in vite)
      base: config.basePath,
      //location to where to put the final client scripts (js)
      client: config.clientPath,
      //global css file path
      css: config.globalCSS,
      //global head component path
      head: config.globalHead,
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
    settings.plugins = await this.plugins();
    //vite build now
    return build({ logLevel: 'silent', ...settings });
  }

  /**
   * Tries to return the vite dev server
   */
  public async dev() {
    if (this.production) {
      throw new Exception('Cannot run dev server in production mode');
    } else if (!this._dev) {
      this._dev = await this._createServer();
    }
    return this._dev;
  }
  
  /**
   * Imports a URL using the dev server
   */
  public async fetch<T = any>(url: string) {
    //for development and build modes
    const dev = await this.dev();
    //use dev server to load the document export
    return await dev.ssrLoadModule(url) as T;
  }

  /**
   * Returns the global head component
   */
  public async head() {
    if (!this._globals.head) {
      this._globals.head = null;
      if (typeof this._paths.head === 'string') {
        const head = await this.import<{ default: ElementType }>(
          this._paths.head
        );
        this._globals.head = head.default || null;
      }
    }
    return this._globals.head;
  }

  /**
   * HTTP middleware
   */
  public async http(req: IM, res: SR) {
    const middlewares = await this.middlewares();
    return await new Promise(r => middlewares(req, res, r));
  }
  
  /**
   * Imports the page component to runtime for dev mode
   */
  public async import<T = any>(
    pathname: string,
    extnames = [ '.js', '.tsx' ]
  ) {
    //determine the page file name
    const meta = await this.resolve(pathname, extnames);
    if (this.production || meta.extname === '.js') {
      //use native import to load the module
      return await import(meta.filepath) as T;
    }
    //use dev server to load the module
    return await this.fetch(`file://${meta.filepath}`) as T;
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
  public async plugins() {
    //add react plugin
    const react = await import('@vitejs/plugin-react');
    //add the imfs plugin
    return [ 
      imfs(), 
      loader(this.loader), 
      react.default(),
      ...this._plugins 
    ];
  }

  /**
   * Returns the absolute filepath to the entry file
   * Throws an Exception if the file is not found
   */
  public async resolve(pathname: string, extnames = [ '.js', '.tsx' ]) {
    const loader = this.loader;
    const filepath = await loader.resolveFile(
      pathname, 
      extnames,
      loader.cwd,
      //throw if not found
      true
    ) as string;
    const basepath = loader.basepath(filepath);
    const extname = path.extname(filepath);
    return { filepath, basepath, extname };
  }

  /**
   * Returns the global styles
   */
  public async styles() {
    if (!this._globals.styles) {
      this._globals.styles = null;
      if (typeof this._paths.css === 'string') {
        this._globals.styles = await this.loader.fs.readFile(
          this._paths.css, 
          'utf8'
        );
      }
    }
    return this._globals.styles;
  }

  /**
   * Create vite dev server logic
   */
  protected async _createServer() {
    const vite = this._viteConfig || {
      server: { 
        middlewareMode: true,
        watch: {  ignored: this._ignore }
      },
      appType: 'custom',
      base: this.paths.base,
      root: this.loader.cwd,
      mode: 'development'
    };
    const { createServer } = await import('vite');
    //shallow copy the vite config
    const config = { ...vite }; 
    //organize plugins
    config.plugins = await this.plugins();
    //create the vite resource
    return await createServer(config);
  }
}