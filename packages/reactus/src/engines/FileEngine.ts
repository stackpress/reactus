//modules
import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { jsx } from 'react/jsx-runtime';
//stackpress
import type { UnknownNest, FileLoader } from '@stackpress/lib';
//root
import type { PageImport, EngineInterface } from '../types';

export default class FileEngine implements EngineInterface {
  //file loader
  protected _loader: FileLoader;

  /**
   * Remember the Vite configuration
   */
  public constructor(loader: FileLoader) {
    this._loader = loader;
  }
  
  /**
   * Returns the client script
   */
  public async getClientScript(file: string) {
    //fix the file path
    file = this.toAbsolute(file, '.js');
    return this._loader.fs.readFileSync(file, 'utf-8');
  }
  
  /**
   * Returns the document markup
   */
  public async getDocumentMarkup(
    file: string, 
    clientScriptRoute: string, 
    documentTemplate: string,
    props: UnknownNest = {}
  ) {
    //import the page
    const elements = await this.render(file, props);
    //return the final html
    return documentTemplate
      .replace(`<!--page-head-->`, elements.head ?? '')
      .replace(`<!--page-body-->`, elements.body ?? '')
      .replace(`<!--page-client-->`, clientScriptRoute);
  }
  
  /**
   * Loads a tsx (server) file in runtime
   */
  public async import<T = unknown>(file: string) {
    //fix the file path
    file = this.toAbsolute(file);
    return await import(file) as T;
  }

  /**
   * Vite tsx (server) renderer
   */
  public async render(file: string, props: UnknownNest = {}) {
    //fix the file path
    file = this.toAbsolute(file, '.js');
    const page = await this.import<PageImport>(file);
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
   * Formats the following to absolute path
   * - @/path/to/file
   * - module/path/to/file
   */
  protected toAbsolute(file: string, extname?: string) {
    file = this._loader.absolute(file);
    //if the file doesn't have the extension
    if (typeof extname === 'string' 
      && extname.length > 0 
      && !file.endsWith(extname)
    ) {
      //add the extension
      file = `${file}${extname}`;
    }
    //return the file
    return file;
  }
}