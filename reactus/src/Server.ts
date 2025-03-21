//node
import path from 'node:path';
//stackpress
import NodeFS from '@stackpress/lib/NodeFS';
//server
import ServerLoader from './server/Loader';
import ServerManifest from './server/Manifest';
import ServerResource from './server/Resource';
import VirtualServer from './server/Virtual';
//local
import type { IM, SR, ServerConfig } from './types';
import { 
  PAGE_TEMPLATE,
  CLIENT_TEMPLATE, 
  DOCUMENT_TEMPLATE,
  STYLE_TEMPLATE
} from './constants';

export default class Server {
  /**
   * Returns the final configuration for the server
   */
  public static configure(options: Partial<ServerConfig>) {
    const cwd = options.cwd || process.cwd();
    return Object.freeze({
      //path where to save assets (css, images, etc)
      // - used in build step
      assetPath: options.assetPath || path.join(cwd, '.reactus/assets'),
      //base path (used in vite)
      // - used in dev mode
      basePath: options.basePath || '/',
      //path where to save the client scripts (js)
      // - used in build step
      clientPath: options.clientPath || path.join(cwd, '.reactus/client'),
      //client script route prefix used in the document markup
      //ie. /client/[id][extname]
      //<script type="module" src="/client/[id][extname]"></script>
      //<script type="module" src="/client/abc123.tsx"></script>
      // - used in dev mode and live server
      clientRoute: options.clientRoute || '/client',
      //template wrapper for the client script (tsx)
      // - used in dev mode and build step
      clientTemplate: options.clientTemplate || CLIENT_TEMPLATE,
      //current working directory
      cwd: options.cwd || process.cwd(),
      //template wrapper for the document markup (html)
      // - used in dev mode and live server
      documentTemplate: options.documentTemplate || DOCUMENT_TEMPLATE,
      //file system
      fs: options.fs || new NodeFS(),
      //path where to save and load (live) the server script (js)
      // - used in build step and live server
      pagePath: options.pagePath || path.join(cwd, '.reactus/page'),
      //template wrapper for the page script (tsx)
      // - used in build step
      pageTemplate: options.pageTemplate || PAGE_TEMPLATE,
      //vite plugins
      plugins: options.plugins || [],
      //directs resolvers and markup generator
      production:  typeof options.production === 'boolean' 
        ? options.production 
        : true,
      //style route prefix used in the document markup
      //ie. /assets/[id][extname]
      //<link rel="stylesheet" type="text/css" href="/client/[id][extname]" />
      //<link rel="stylesheet" type="text/css" href="/assets/abc123.css" />
      // - used in live server
      styleRoute: options.styleRoute || '/assets',
      //template wrapper for the styles (css)
      styleTemplate: options.styleTemplate || STYLE_TEMPLATE,
      //original vite options (overrides other settings related to vite)
      vite: options.vite,
      //ignore files in watch mode
      // - used in dev mode
      watchIgnore: options.watchIgnore || []
    });
  }

  //server file loader
  public readonly loader: ServerLoader;
  //server manifest
  public readonly manifest: ServerManifest;
  //server resource
  public readonly resource: ServerResource;
  //directs resolvers and markup generator
  public readonly production: boolean;
  //virtual file system
  public readonly vfs = new VirtualServer();

  //build paths
  protected _paths: {
    //path where to save assets (css, images, etc)
    asset: string,
    //location to where to put the final client scripts (js)
    client: string,
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
    page: string,
    //template wrapper for the page script (css)
    style?: string
  };

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
   * Sets the templates and vite configuration
   */
  constructor(config: ServerConfig) {
    const cwd = config.cwd || process.cwd();
    this.production = config.production;
    this.manifest = new ServerManifest(this);
    this.resource = new ServerResource(this, {
      //base path (used in vite)
      // - used in dev mode
      basePath: config.basePath,
      //original vite options (overrides other settings related to vite)
      config: config.vite,
      //current working directory
      cwd: cwd,
      //vite plugins
      plugins: config.plugins,
      //ignore files in watch mode
      // - used in dev mode
      watchIgnore: config.watchIgnore
    });
    this.loader = new ServerLoader({ 
      fs: config.fs, 
      cwd: cwd, 
      resource: this.resource, 
      production: this.production 
    });
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
      page: config.pageTemplate,
      //template wrapper for the page script (css)
      style: config.styleTemplate
    };
  }

  /**
   * HTTP middleware
   */
  public async http(req: IM, res: SR) {
    const middlewares = await this.resource.middlewares();
    return await new Promise(r => middlewares(req, res, r));
  }
}