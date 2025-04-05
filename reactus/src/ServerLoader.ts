//node
import path from 'node:path';
//stackpress
import type { FileSystem } from '@stackpress/lib/types';
import FileLoader from '@stackpress/lib/FileLoader';
import NodeFS from '@stackpress/lib/NodeFS';
//local
import type ServerResource from './ServerResource';

export type ServerLoaderConfig = {
  fs?: FileSystem,
  cwd?: string,
  production: boolean,
  resource: ServerResource
}

export default class ServerLoader {
  //file loader
  protected _loader: FileLoader;
  protected _production: boolean;
  //vite instance
  protected _resource: ServerResource;

  public get cwd() {
    return this._loader.cwd;
  }

  public get fs() {
    return this._loader.fs;
  }

  constructor(config: ServerLoaderConfig) {
    const { fs = new NodeFS(), cwd = process.cwd() } = config;
    this._loader = new FileLoader(fs, cwd);
    this._production = config.production;
    this._resource = config.resource;
  }
  
  /**
   * Returns the absolute path to the pathname given
   * NOTE: This is not a resolver, it just returns the path
   */
  public async absolute(pathname: string, pwd = this.cwd) {
    return await this._loader.absolute(pathname, pwd);
  }

  /**
   * Imports a URL using the dev server
   */
  public async fetch<T = any>(url: string) {
    //for development and build modes
    const dev = await this._resource.dev();
    //use dev server to load the document export
    return await dev.ssrLoadModule(url) as T;
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
    if (this._production || meta.extname === '.js') {
      //use native import to load the module
      return await this._loader.import<T>(meta.filepath);
    }
    //use dev server to load the module
    return await this.fetch(`file://${meta.filepath}`) as T;
  }

  /**
   * Returns the relative path from the source file to the required file
   * Note: This works better if using absolute paths from Loader.aboslute()
   */
  public relative(pathname: string, require: string, withExtname = false) {
    return this._loader.relative(pathname, require, withExtname);
  }

  /**
   * Resolves a pathname (file)
   */
  public resolveFile(
    pathname: string, 
    extnames = [ '.js', '.json' ], 
    pwd = this._loader.cwd, 
    exists = false
  ) {
    return this._loader.resolveFile(pathname, extnames, pwd, exists);
  }

  /**
   * Returns the absolute filepath to the entry file
   * Throws an Exception if the file is not found
   */
  public async resolve(pathname: string, extnames = [ '.js', '.tsx' ]) {
    const loader = this._loader;
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
}