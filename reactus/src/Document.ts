//node
import path from 'node:path';
//modules
import type { PluginOption } from 'vite';
import type { RollupOutput } from 'rollup';
import type { ElementType } from 'react';
import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { jsx } from 'react/jsx-runtime';
//stackpress
import type { UnknownNest } from '@stackpress/lib/types';
//local
import type { DocumentImport, ViteConfig, BuildResults } from './types';
import type Server from './Server';
import Exception from './Exception';
import { id } from './helpers';

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
   * Returns the final client entry 
   * source code (js) and assets
   */
  async getAssets(plugins: PluginOption[] = []) {
    //make the asset build options
    const config = await this._getAssetBuildOptions(plugins);
    //now really build the page
    const results = await this.server.build(config) as RollupOutput;

    return results.output;
  }

  /**
   * Returns the final client entry 
   * source code (js) and assets
   */
  async getClient(plugins: PluginOption[] = []) {
    //calculate file path relative to the page file
    const file = `${await this.source()}.client.tsx`;
    //now make the entry file relative to the root entry file
    const relative = await this._entryToRelativeFile(file);
    //get the client script template (tsx)
    const clientScript = this.server.templates.client;
    //add the relative entry to the document script
    const code = clientScript.replace('{entry}', relative);
    //convert to data url
    const data = Buffer.from(code).toString('base64');
    const url = `imfs:text/typescript;base64,${data};${file}`;
    //make the client build options
    const config = this._getClientBuildOptions(url, plugins);
    //now really build the client
    const results = await this.server.build(config) as RollupOutput;
    return results.output;
  }

  /**
   * Returns the client entry for HMR (js)
   */
  async getHMR() {
    //for development and build modes
    const dev = await this.server.dev();
    //calculate file path relative to the page file
    const file = `${await this.source()}.entry.tsx`;
    //now make the entry file relative to the root entry file
    const relative = await this._entryToRelativeFile(file);
    //get the client script template (tsx)
    const clientScript = this.server.templates.client;
    //add the relative entry to the document script
    const code = clientScript.replace('{entry}', relative);
    //convert to data url
    const data = Buffer.from(code).toString('base64');
    const url = `imfs:text/typescript;base64,${data};${file}`;
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
  async getMarkup(props: UnknownNest = {}) {
    return this.server.production 
      ? await this._getMarkup(props)
      : await this._getDevMarkup(props);
  }

  /**
   * Returns the final page component source code (js)
   */
  async getPage(plugins: PluginOption[] = [], assets?: BuildResults) {
    //if assets are not provided, build for them
    assets = assets || await this.getAssets(plugins);
    //only get the style file names
    //ie. /assets/abc-123.css -> abc-123.css
    const styles = assets
      .filter(asset => asset.type === 'asset')
      .filter(asset => asset.fileName.startsWith('assets/'))
      .filter(asset => path.extname(asset.fileName) === '.css')
      .map(asset => asset.fileName.substring(7));
    //calculate file path relative to the page file
    const file = `${await this.source()}.page.tsx`;
    //now make the entry file relative to the root entry file
    const relative = await this._entryToRelativeFile(file);
    //get the client script template (tsx)
    const pageScript = this.server.templates.page;
    //add the relative entry to the document script
    const code = pageScript
      .replace('{entry}', relative)
      .replace('{entry}', relative)
      .replace('{styles}', JSON.stringify(styles));
    //convert to data url
    const data = Buffer.from(code).toString('base64');
    const url = `imfs:text/typescript;base64,${data};${file}`;
    //make the page build options
    const config = this._getPageBuildOptions(url, plugins);
    //now really build the page
    const results = await this.server.build(config) as RollupOutput;
    return results.output;
  }

  /**
   * Imports the page component to runtime
   */
  async importPage() {
    return this.server.production 
      ? await this._importPage()
      : await this._importDevPage();
  }

  /**
   * Returns true if entry is a node module entry
   */
  public async isModule() {
    const source = await this.source();
    return source.includes('node_modules');
  }

  /**
   * Returns the absolute filepath to the entry file
   * Throws an Exception if the file is not found
   */
  public async resolve(extnames = [ '.js', '.tsx' ]) {
    const loader = this.server.loader;
    const filepath = await loader.resolveFile(
      this.entry, 
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
   * Returns the absolute path to the entry file
   */
  public async source() {
    const loader = this.server.loader;
    return await loader.absolute(this.entry);
  }

  /**
   * Changes the entry path to a relative file path
   * 
   * Entry path formats:
   * - @/path/to/file
   * - module/path/to/file
   */
  protected async _entryToRelativeFile(fromFile: string) {
    if (this.entry.startsWith(`@${path.sep}`)) {
      const absolute = await this.source();
      return this.server.loader.relative(fromFile, absolute);
    }
    return this.entry;
  }

  /**
   * Generates the client build options
   */
  protected async _getAssetBuildOptions(plugins: PluginOption[]) {
    return {
      configFile: false,
      //this is used to resolve node modules
      root: this.server.loader.cwd,
      plugins,
      build: {
        //Prevents writing to disk
        write: false, 
        rollupOptions: {
          input: await this.source(),
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
  protected _getClientBuildOptions(url: string, plugins: PluginOption[]) {
    return {
      configFile: false,
      //this is used to resolve node modules
      root: this.server.loader.cwd,
      plugins,
      build: {
        //Prevents writing to disk
        write: false, 
        rollupOptions: {
          input: url,
          output: {
            //Ensures ES module output
            format: 'es',
            //Preserves output structure
            entryFileNames: '[name].js',
          }
        }
      }
    } as ViteConfig;
  }

  /**
   * Returns the document markup for dev mode
   */
  protected async _getDevMarkup(props: UnknownNest = {}) {
    //import the page
    const document = await this._importDevPage();
    //get the document script template (tsx)
    const documentTemplate = this.server.templates.document;
    //for development and build modes
    const dev = await this.server.dev();
    //determine the client route
    const clientRoute = `${this.server.routes.client}/${this.id}.tsx`;
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
    const body = this._render(document.default, props);
    //render the head
    const head = this._render(document.Head, props);
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
  protected async _getMarkup(props: UnknownNest = {}) {
    //import the page
    const document = await this._importPage();
    //get the document script template (tsx)
    const documentTemplate = this.server.templates.document;
    //determine the client route
    const clientRoute = `${this.server.routes.client}/${this.id}.js`;
    //determine style routes
    const stylesRoutes = (document.styles || []).map(
      style => `${this.server.routes.style}/${style}`
    );
    //render the body
    const body = this._render(document.default, props);
    //render the head
    const head = this._render(document.Head, { 
      ...props, 
      styles: stylesRoutes
    });
    //return the final html
    return documentTemplate
      .replace(`<!--document-head-->`, head ?? '')
      .replace(`<!--document-body-->`, body ?? '')
      .replace(`<!--document-props-->`, JSON.stringify(props))
      .replace(`<!--document-client-->`, clientRoute);
  }

  /**
   * Generates the client build options
   */
  protected _getPageBuildOptions(url: string, plugins: PluginOption[]) {
    return {
      configFile: false,
      //this is used to resolve node modules
      root: this.server.loader.cwd,
      plugins,
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
   * Imports the page component to runtime for dev mode
   */
  protected async _importDevPage() {
    //for development and build modes
    const dev = await this.server.dev();
    //determine the server entry file name (page.tsx)
    const { filepath, extname } = await this.resolve();
    if (extname === '.js') {
      //use native import to load the document export
      return await import(filepath) as DocumentImport;
    }
    //use dev server to load the document export
    return await dev.ssrLoadModule(
      `file://${filepath}`
    ) as DocumentImport;
  }

  /**
   * Imports the page component to runtime
   */
  protected async _importPage() {
    //get the page path
    const pagePath = this.server.paths.page;
    //determine the page file name
    const file = path.join(pagePath, `${this.id}.js`);
    //use native import to load the page export
    return await import(file) as DocumentImport;
  }

  /**
   * Shortcut for renderToString
   */
  protected _render(element?: ElementType, props: UnknownNest = {}) {
    return element ? renderToString(
      jsx(StrictMode, { children: jsx(element, { ...props }) })
    ): '';
  }
}