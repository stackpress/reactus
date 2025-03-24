//node
import path from 'node:path';
//modules
import type { RollupOutput } from 'rollup';
//common
import type { ViteConfig, BuildResults } from '../types';
import type Document from '../Document';
import type Server from '../Server';

export default class DocumentBuilder {
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
   * Returns the final client entry 
   * source code (js) and assets
   */
  async buildAssets() {
    const { resource, templates } = this._server;
    //get the client script template (tsx)
    const pageScript = templates.page;
    //add the relative entry to the document script
    const code = pageScript.replace('{styles}', '[]');
    //make in memory file string url
    const url = await this._renderVFS('assets', code);
    //make the asset build options
    const config = await this._getAssetBuildOptions(url);
    //now really build the page
    const results = await resource.build(config) as RollupOutput;
    return results.output;
  }

  /**
   * Returns the final client entry 
   * source code (js) and assets
   */
  async buildClient() {
    const { resource, templates } = this._server;
    //get the client script template (tsx)
    const template = templates.client;
    //make in memory file string url
    const url = await this._renderVFS('client', template);
    //make the client build options
    const config = await this._getClientBuildOptions(url);
    //now really build the client
    const results = await resource.build(config) as RollupOutput;
    return results.output;
  }

  /**
   * Returns the final page component source code (js)
   */
  async buildPage(assets?: BuildResults) {
    const { resource, templates } = this._server;
    //if assets are not provided, build for them
    assets = assets || await this.buildAssets();
    //only get the style file names
    //ie. /assets/abc-123.css -> abc-123.css
    const styles = assets
      .filter(asset => asset.type === 'asset')
      .filter(asset => asset.fileName.startsWith('assets/'))
      .filter(asset => path.extname(asset.fileName) === '.css')
      .map(asset => asset.fileName.substring(7));
    //get the client script template (tsx)
    const pageScript = templates.page;
    //add the relative entry to the document script
    const code = pageScript.replace('{styles}', JSON.stringify(styles));
    //make in memory file string url
    const url = await this._renderVFS('page', code);
    //make the page build options
    const config = await this._getPageBuildOptions(url);
    //now really build the page
    const results = await resource.build(config) as RollupOutput;
    return results.output;
  }

  /**
   * Generates the client build options
   */
  protected async _getAssetBuildOptions(url: string) {
    const { resource, loader } = this._server;
    return {
      configFile: false,
      //this is used to resolve node modules
      root: loader.cwd,
      plugins: await resource.plugins(),
      build: {
        //Prevents writing to disk
        write: false, 
        rollupOptions: {
          input: url,
          output: {
            format: 'es',
            entryFileNames: '[name].js',
          }
        }
      }
    } as ViteConfig;
  }

  /**
   * Generates the client build options
   */
  protected async _getClientBuildOptions(url: string) {
    const { resource, loader } = this._server;
    return {
      configFile: false,
      //this is used to resolve node modules
      root: loader.cwd,
      plugins: await resource.plugins(),
      build: {
        //Prevents writing to disk
        write: false, 
        rollupOptions: {
          input: url,
          output: {
            format: 'es',
            entryFileNames: '[name].js',
          }
        }
      }
    } as ViteConfig;
  }

  /**
   * Generates the client build options
   */
  protected async _getPageBuildOptions(url: string) {
    const { resource, loader } = this._server;
    return {
      configFile: false,
      //this is used to resolve node modules
      root: loader.cwd,
      plugins: await resource.plugins(),
      build: {
        //Prevents writing to disk
        write: false, 
        //dont minify yet..
        //minify: false, 
        rollupOptions: {
          // 🔥 Preserve all exports
          preserveEntrySignatures: 'exports-only', 
          input: url,
          // Do not bundle React
          external: [ 'react', 'react-dom', 'react/jsx-runtime' ],
          output: {
            // Ensures ES module output
            format: 'es', 
            // Preserves output structure
            entryFileNames: '[name].js', 
            // Ensures named exports are available
            exports: 'named', 
            globals: {
              react: 'React',
              'react-dom': 'ReactDOM',
              'react/jsx-runtime': 'jsxRuntime'
            }
          }
        }
      }
    } as ViteConfig;
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