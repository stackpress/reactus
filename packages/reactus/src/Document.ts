//node
import path from 'node:path';
//modules
import type { PluginOption } from 'vite';
import type { RollupOutput } from 'rollup';
import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { jsx } from 'react/jsx-runtime';
//stackpress
import type { UnknownNest } from '@stackpress/lib/dist/types';
//local
import type { DocumentImport } from './types';
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
   * Returns the absolute path to the entry file
   */
  public get source() {
    const loader = this.server.loader;
    return loader.absolute(this.entry);
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
    return await this.server.build({
      configFile: false,
      //this is used to resolve node modules
      root: this.server.loader.cwd,
      plugins,
      build: {
        //Prevents writing to disk
        write: false, 
        rollupOptions: {
          input: this.source,
          output: {
            format: 'es',
            entryFileNames: '[name].js',
          }
        }
      }
    }) as RollupOutput;
  }

  /**
   * Returns the final client entry 
   * source code (js) and assets
   */
  async getClient(plugins: PluginOption[] = []) {
    //calculate file path relative to the page file
    const file = `${this.source}.client.tsx`;
    //now make the entry file relative to the root entry file
    const relative = this._entryToRelativeFile(file);
    //get the client script template (tsx)
    const clientScript = this.server.templates.client;
    //add the relative entry to the document script
    const code = clientScript.replace('{entry}', relative);
    //convert to data url
    const data = Buffer.from(code).toString('base64');
    const url = `imfs:text/typescript;base64,${data};${file}`;
    return await this.server.build({
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
            format: 'es',
            entryFileNames: '[name].js',
          }
        }
      }
    }) as RollupOutput;
  }

  /**
   * Returns the client entry for HMR (js)
   */
  async getHMR() {
    //for development and build modes
    const dev = await this.server.dev();
    //calculate file path relative to the page file
    const file = `${this.source}.entry.tsx`;
    //now make the entry file relative to the root entry file
    const relative = this._entryToRelativeFile(file);
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
    //import the page
    const document = await this.importPage();
    //organize the markup elements
    const elements = {
      head: document.Head ? renderToString(
        jsx(StrictMode, { children: jsx(document.Head, props) })
      ): undefined,
      body: renderToString(
        jsx(StrictMode, { children: jsx(document.default, props) })
      )
    };
    //get the document script template (tsx)
    const documentTemplate = this.server.templates.document;
    //if mode is development (not production, not build)
    if (!this.server.production) {
      //for development and build modes
      const dev = await this.server.dev();
      //determine the client route
      const clientRoute = `${this.server.route}/${this.id}.tsx`;
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
      //return the final html
      return html
        .replace(`<!--document-head-->`, elements.head ?? '')
        .replace(`<!--document-body-->`, elements.body ?? '')
        .replace(`<!--document-props-->`, JSON.stringify(props))
        .replace(`<!--document-client-->`, clientRoute);
    }
    //determine the client route
    const clientRoute = `${this.server.route}/${this.id}.js`;
    //return the final html
    return documentTemplate
      .replace(`<!--document-head-->`, elements.head ?? '')
      .replace(`<!--document-body-->`, elements.body ?? '')
      .replace(`<!--document-props-->`, JSON.stringify(props))
      .replace(`<!--document-client-->`, clientRoute);
  }

  /**
   * Returns the final page component source code (js)
   */
  async getPage(plugins: PluginOption[] = []) {
    const results = await this.server.build({
      configFile: false,
      //this is used to resolve node modules
      root: this.server.loader.cwd,
      plugins,
      build: {
        //Prevents writing to disk
        write: false, 
        //sure, minify it...
        minify: true, 
        lib: {
          entry: `${this.source}.tsx`,
          // Output only ES module
          formats: ['es'], 
        },
        rollupOptions: {
          external: ['react', 'react-dom'], // Do not bundle React
          output: {
            globals: {
              react: 'React',
              'react-dom': 'ReactDOM',
            },
          }
        }
      }
    }) as RollupOutput[];
    return results[0];
  }

  /**
   * Imports the page component to runtime
   */
  async importPage() {
    //if production mode
    if (this.server.production) {
      //get the page path
      const pagePath = this.server.paths.page;
      //determine the page file name
      const file = path.join(pagePath, `${this.id}.js`);
      //use native import to load the page export
      return await import(file) as DocumentImport;
    }
    //for development and build modes
    const dev = await this.server.dev();
    //determine the server entry file name (page.tsx)
    const file = this.source;
    //use dev server to load the document export
    return await dev.ssrLoadModule(
      `file://${file}.tsx`
    ) as DocumentImport;
  }

  /**
   * Changes the entry path to a relative file path
   * 
   * Entry path formats:
   * - @/path/to/file
   * - module/path/to/file
   */
  protected _entryToRelativeFile(fromFile: string) {
    if (this.entry.startsWith(`@${path.sep}`)) {
      const absolute = this.source;
      return this.server.loader.relative(fromFile, absolute);
    }
    return this.entry;
  }
}