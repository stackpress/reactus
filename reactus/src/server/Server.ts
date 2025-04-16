//node
import path from 'node:path';
//stackpress
import FileLoader from '@stackpress/lib/FileLoader';
//local
import type { ServerConfig } from './types.js';

export default class Server {
  //server file loader
  public readonly loader: FileLoader;
  //build paths
  protected _paths: Record<string, string>;
  //route prefixes
  protected _routes: Record<string, string>;
  //template wrappers for the client, document, and server
  protected _templates: Record<string, string>;

  /**
   * Returns the current working directory
   */
  public get cwd() {
    return this.loader.cwd;
  }

  /**
   * Returns the file system
   */
  public get fs() {
    return this.loader.fs;
  }

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
    this.loader = new FileLoader(config.fs, cwd);
    //build paths
    this._routes = {
      //client route prefix used in the document markup
      client: config.clientRoute,
      //style route prefix used in the document markup
      css: config.cssRoute
    };
    //route paths
    this._paths = {
      //location to where to put the final page script (js)
      page: config.pagePath
    };
    //template wrappers
    this._templates = {
      //template wrapper for the document markup (html)
      document: config.documentTemplate
    };
  }

  /**
     * Imports the page component to runtime for dev mode
     */
    public async import<T = any>(
      pathname: string,
      extnames = [ '.js' ]
    ) {
      //determine the page file name
      const meta = await this.resolve(pathname, extnames);
      //use native import to load the module
      return await this.loader.import<T>(meta.filepath);
    }
  
    /**
     * Returns the absolute filepath to the entry file
     * Throws an Exception if the file is not found
     */
    public async resolve(pathname: string, extnames = [ '.js' ]) {
      const filepath = await this.loader.resolveFile(
        pathname, 
        extnames,
        this.cwd,
        //throw if not found
        true
      ) as string;
      const basepath = this.loader.basepath(filepath);
      const extname = path.extname(filepath);
      return { filepath, basepath, extname };
    }
}