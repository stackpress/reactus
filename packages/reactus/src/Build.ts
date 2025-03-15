//node
import fs from 'node:fs/promises';
import path from 'node:path';
//stackpress
import type { UnknownNest } from '@stackpress/lib/dist/types';
//local
import type Manifest from './Manifest';
import { hash } from './helpers';

export default class Build {
  //manifest parent
  public readonly manifest: Manifest;
  //entry file
  public readonly entry: string;

  /**
   * Generates an id for the entry file
   */
  public get id() {
    return hash(this.entry, 16);
  }

  /**
   * Sets the manifest and entry file
   */
  public constructor(manifest: Manifest, entry: string) {
    this.manifest = manifest;
    this.entry = entry;
  }

  /**
   * Vite tsx client script renderer
   */
  public async client() {
    //get loader, engine, development, client from manifest
    const { engine, loader, development, template } = this.manifest;
    //get the client path
    const clientPath = this.manifest.path.client;
    //determine the client file name
    let file = path.join(clientPath, `${this.id}.js`);
    //if in development mode
    if (development) {
      //should be tsx
      file = path.join(clientPath, `${this.id}.tsx`);
      //determine the tsx code
      let relative = this.entry;
      if (relative.startsWith(`@${path.sep}`)) {
        relative = loader.absolute(relative);
        relative = loader.relative(file, relative);
      }
      const code = template.client.replace('{entry}', relative);
      //if the folder doesn't exist, create it
      if (!await fs.stat(clientPath).catch(() => false)) {
        await fs.mkdir(clientPath, { recursive: true });
      }
      //now cache the tsx code
      await fs.writeFile(file, code);
    }
    //then let the engine transform the file to js
    return await engine.getClientScript(file);
  }

  /**
   * Vite tsx (server) document renderer
   */
  public document(props: UnknownNest = {}) {
    //get engine, development and document from manifest
    const { engine, development, template } = this.manifest;
    const clientScriptRoute = development 
      ? `/client/${this.id}.tsx`
      : `/client/${this.id}.js` 
    return engine.getDocumentMarkup(
      this.entry,
      clientScriptRoute,
      template.document,
      props
    );
  }

  /**
   * Loads a tsx (server) file in runtime
   */
  public import<T = unknown>() {
    return this.manifest.engine.import<T>(this.entry);
  }

  /**
   * Vite tsx (server) renderer
   */
  public render(props: UnknownNest = {}) {
    return this.manifest.engine.render(this.entry, props);
  }
}