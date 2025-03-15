//node
import fs from 'node:fs/promises';
import path from 'node:path';
//modules
import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { jsx } from 'react/jsx-runtime';
//stackpress
import type { UnknownNest } from '@stackpress/lib/dist/types';
//local
import type { PageImport } from './types';
import type Manifest from './Manifest';
import Exception from './Exception';
import { hash, HASH_LENGTH } from './helpers';

/**
 * Manages all build steps for development, build 
 * and production for a particular page
 * 
 * With Dev Server:
 * - Render the markup (runtime)
 * - Return to client script code (in memory) to serve the client script
 *   - This requires that we save the client script (tsx) to disk first
 * With Build:
 * - Save the document script (js)
 * - Save the client script (js)
 * - (Optional) Save the document markup (html)
 *   - This is for SSG
 *   - Cannot have dynamic server props
 * On Production:
 * - Import the document script (cached) and render the markup (runtime)
 * - Use the cached client files to serve the client script
 */
export default class Page {
  //manifest parent
  public readonly manifest: Manifest;
  //entry file formats
  // - @/path/to/file
  // - module/path/to/file
  public readonly entry: string;

  /**
   * Generates an id for the entry file
   */
  public get id() {
    return hash(this.entry, HASH_LENGTH);
  }

  /**
   * Sets the manifest and entry file
   */
  public constructor(manifest: Manifest, entry: string) {
    this.manifest = manifest;
    this.entry = entry;
  }

  /**
   * Returns the final client source code (js)
   * 
   * if production mode
   *  - Load the build file using native FS
   *  - Return the file contents
   * if development, build mode
   *  - Save the client tsx
   *  - Let vite transform the file to js
   *  - Return the transformed code
   */
  public async getClient() {
    //for production mode
    if (this.manifest.mode === 'production') {
      //get the client path
      const clientPath = this.manifest.path.client;
      //determine the client file name
      const file = path.join(clientPath, `${this.id}.js`);
      return await fs.readFile(file, 'utf8');
    }
    //for development and build modes
    const resource = await this.manifest.resource();
    if (!resource) {
      throw Exception.for('Vite resource not found');
    }
    //save the source tsx
    const file = await this.saveSource();
    //then let vite transform the file to js
    const results = await resource.transformRequest(
      `file://${file}`, 
      { ssr: false }
    );
    if (results === null) {
      throw Exception.for('File tsx to js transformation failed');
    }
    return results.code;
  }

  /**
   * Returns the document markup (html)
   * 
   * - Load the document script. see `loadDocumentScript` logic
   * - Get head and body markup strings
   * - if development, add the react hmr preamble
   * - bind head, body and client route to the document template
   * - return the final html
   */
  public async getMarkup(props: UnknownNest = {}) {
    //import the page
    const document = await this.loadPage();
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
    const documentTemplate = this.manifest.template.document;
    //if mode is development (not production, not build)
    if (this.manifest.mode === 'development') {
      //for development and build modes
      const resource = await this.manifest.resource();
      if (!resource) {
        throw Exception.for('Vite resource not found');
      }
      //determine the client route
      const clientRoute = `${this.manifest.route}/${this.id}.tsx`;
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
        .replace(`<!--page-client-->`, clientRoute);
    }
    //determine the client route
    const clientRoute = `${this.manifest.route}/${this.id}.js`;
    //return the final html
    return documentTemplate
      .replace(`<!--page-head-->`, elements.head ?? '')
      .replace(`<!--page-body-->`, elements.body ?? '')
      .replace(`<!--page-client-->`, clientRoute);
  }

  /**
   * Returns the final page source code (js)
   * 
   * if production mode
   *  - Load the build file using native FS
   *  - Return the file contents
   * if development, build mode
   *  - Save the client tsx
   *  - Let vite transform the file to js
   *  - Return the transformed code
   */
  public async getPage() {
    //for production mode
    if (this.manifest.mode === 'production') {
      //get the page path
      const pagePath = this.manifest.path.page;
      //determine the page file name
      const file = path.join(pagePath, `${this.id}.js`);
      return await fs.readFile(file, 'utf8');
    }
    //for development and build modes
    const resource = await this.manifest.resource();
    if (!resource) {
      throw Exception.for('Vite resource not found');
    }
    //save the page tsx
    const file = this._entryToAbsolute();
    //then let vite transform the file to js
    const results = await resource.transformRequest(
      `file://${file}`, 
      { ssr: true }
    );
    if (results === null) {
      throw Exception.for('File tsx to js transformation failed');
    }
    return results.code;
  }

  /**
   * Returns the client source code (tsx)
   * 
   * - Determine the relative source file path (tsx)
   * - Bind relative entry path with client template
   * - Return the final source script
   */
  public async getSource() {
    //get the client source path
    const sourcePath = this.manifest.path.src;
    //determine the root entry file where entry would be imported from
    const fromFile = path.join(sourcePath, `${this.id}.tsx`);
    //now make the entry file relative to the root entry file
    const relative = this._entryToRelativeFile(fromFile);
    //get the client script template (tsx)
    const clientScript = this.manifest.template.client;
    //add the relative entry to the document script
    return clientScript.replace('{entry}', relative);
  }

  /**
   * Loads the page source in runtime (node)
   * 
   * if production,
   * - Locate the build file from `document.path.build` (/.reactus/build/document/[id].js)
   * - Import the file and return the exported
   * if development or build,
   * - Locate the dev file from `document.path.dev` (/.reactus/src/document/[id].tsx)
   * - Import the file and return the exported
   */
  public async loadPage() {
    if (this.manifest.mode === 'production') {
      //get the page path
      const pagePath = this.manifest.path.page;
      //determine the page file name
      const file = path.join(pagePath, `${this.id}.js`);
      //use native import to load the page export
      return await import(file) as PageImport;
    }
    //for development and build modes
    const resource = await this.manifest.resource();
    if (!resource) {
      throw Exception.for('Vite resource not found');
    }
    //determine the page file name (page.tsx)
    const file = this._entryToAbsolute();
    //use dev server to load the document export
    return await resource.ssrLoadModule(`file://${file}.tsx`) as PageImport;
  }

  /**
   * Compiles and saves the final client source code (js)
   * 
   * - Locate the build file from `path.client` (/.reactus/client/[id].tsx)
   * - Gets the client source code from `getClientScript` 
   * - Saves source code as a js file
   */
  public async saveClient() {
    //get the client path
    const clientPath = this.manifest.path.client;
    //determine the client file name
    const file = path.join(clientPath, `${this.id}.js`);
    //get the client script (js)
    const code = await this.getClient();
    //write to disk
    return this._writeFile(file, code);
  }

  /**
   * Compiles and saves the page markup code (html)
   * 
   * This is for SSG
   * 
   * - Gets the page markup from `getPageMarkup` 
   * - Saves source code to destination as an html file
   */
  public async saveMarkup(destination: string, props: UnknownNest = {}) {
    //get the page markup (html)
    const code = await this.getMarkup(props);
    //write to disk
    return this._writeFile(destination, code);
  }

  /**
   * Compiles and saves the final page source code (js)
   * 
   * - Locate the build file from `path.page` (/.reactus/page/[id].js)
   * - Gets the page source code from `getPageScript` 
   * - Saves source code as a js file
   */
  public async savePage() {
    //get the page path
    const pagePath = this.manifest.path.page;
    //determine the page file name
    const file = path.join(pagePath, `${this.id}.js`);
    //get the page script (js)
    const code = await this.getPage();
    //write to disk
    return this._writeFile(file, code);
  }

  /**
   * Compiles and saves the client source code (tsx)
   * 
   * - Locate the dev file from `path.src` (/.reactus/src/[id].tsx)
   * - Gets the client source code from `getSourceScript` 
   * - Saves source code as a tsx file
   */
  public async saveSource() {
    //get the client source path
    const sourcePath = this.manifest.path.src;
    //determine the client source file name
    const file = path.join(sourcePath, `${this.id}.tsx`);
    //get the client source script (tsx)
    const code = await this.getSource();
    //write to disk
    return this._writeFile(file, code);
  }

  /**
   * Changes the entry path to an absolute file path
   * 
   * Entry path formats:
   * - @/path/to/file
   * - module/path/to/file
   */
  protected _entryToAbsolute() {
    const loader = this.manifest.loader;
    return loader.absolute(this.entry);
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
      const absolute = this._entryToAbsolute();
      return this.manifest.loader.relative(fromFile, absolute);
    }
    return this.entry;
  }

  /**
   * Saves a file (creates directory if necessary)
   */
  protected async _writeFile(file: string, code: string) {
    const dirname = path.dirname(file);
    //if the folder doesn't exist, create it
    if (!await fs.stat(dirname).catch(() => false)) {
      await fs.mkdir(dirname, { recursive: true });
    }
    //now cache the tsx code
    await fs.writeFile(file, code);
    return file;
  }
}