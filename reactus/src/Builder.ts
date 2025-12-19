//node
import path from 'node:path';
//local
import type { BuildStatus } from './types.js';
import Server from './Server.js';
import Exception from './Exception.js';
import { writeFile } from './helpers.js';

export default class Builder extends Server {
  /**
   * Builds and saves the assets used from all the documents
   */
  public async buildAssets() {
    //buffer for the build status results
    const results: BuildStatus[] = [];
    //loop through all the documents
    for (const document of this.manifest.values()) {
      //this gives the page component source code (js) and assets
      const page = await document.builder.buildAssets();
      //if the output is not an array
      if (!Array.isArray(page)) {
        //push an error
        results.push(Exception.for(
          `Assets for '${document.entry}' was not generated`
        ).withCode(500).toResponse());
        //dont do anything else
        continue;
      }
      //loop through all the outputs
      for (const output of page) {
        //if the output is not an asset
        if (output.type !== 'asset') continue;
        //if output does not start with assets/
        if (!output.fileName.startsWith('assets/')) {
          //push an error
          results.push(Exception.for(
            `${output.type} '${output.fileName}' was not saved`
          ).withCode(404).toResponse());
          continue;
        }
        //determine the file path
        const file = path.join(
          this.paths.asset, 
          output.fileName.substring(7)
        );
        //write the file to disk
        await writeFile(file, output.source);
        //push the result
        results.push({
          code: 200,
          status: 'OK',
          results: {
            type: 'asset',
            id: document.id,
            entry: document.entry,
            contents: output.source,
            destination: file
          }
        });
      }
    }
    return results;
  }

  /**
   * Builds and saves the client entries from all the documents
   */
  public async buildClients() {
    //buffer for the build status results
    const results: BuildStatus[] = [];
    //loop through all the documents
    for (const document of this.manifest.values()) {
      //this just gives the entry code (js) (chunk)
      const client = await document.builder.buildClient();
      //if the output is not an array
      if (!Array.isArray(client)) {
        //push an error
        results.push(Exception.for(
          `Client '${document.entry}' was not generated`
        ).withCode(500).toResponse());
        //do not do anything else
        continue;
      }
      //get all the chunks
      const chunks = client.filter(output => output.type === 'chunk');
      //if a chunk was not found
      if (chunks.length === 0) {
        //push an error
        results.push(Exception.for(
          `Client '${document.entry}' was not generated`
        ).withCode(404).toResponse());
        //skip the rest...
        continue;
      }
      //the first chunk is the entry point
      // and the rest are assets...
      for (const asset of chunks.slice(1)) {
        //skip if not in a folder (ie. assets/some-file-abc123.js)
        if (asset.fileName.split('/').length <= 1) {
          continue;
        }
        //determine the file path 
        // (ie. /path/to/client/assets/some-file-abc123.js)
        const file = path.join(this.paths.client, asset.fileName); 
        //go ahead and write the asset file to disk
        await writeFile(file, asset.code);   
      }
      //now for the main entry chunk...
      //determine the file path
      const file = path.join(
        this.paths.client, 
        `${document.id}.js`
      );
      //write the file to disk
      await writeFile(file, chunks[0].code);
      const absolute = await document.loader.absolute();
      //push the result
      results.push({
        code: 200,
        status: 'OK',
        results: {
          type: 'client',
          id: document.id,
          entry: document.entry,
          contents: chunks[0].code,
          source: absolute,
          destination: file
        }
      });
    }
    //return the results
    return results;
  }

  /**
   * Builds and saves the pages scripts from all the documents
   */
  public async buildPages() {
    //buffer for the build status results
    const results: BuildStatus[] = [];
    //loop through all the documents
    for (const document of this.manifest.values()) {
      //this gives the page component source code (js) and assets
      const page = await document.builder.buildPage();
      //if the output is not an array
      if (!Array.isArray(page)) {
        //push an error
        results.push(Exception.for(
          `Page '${document.entry}' was not generated`
        ).withCode(500).toResponse());
        //dont do anything else
        continue;
      }
      //find the output with type chunk
      const chunk = page.find(
        output => output.type === 'chunk'
      );
      //if a chunk was not found
      if (!chunk) {
        //push an error
        results.push(Exception.for(
          `Page '${document.entry}' was not generated`
        ).withCode(404).toResponse());
        //skip the rest...
        continue;
      }
      //determine the file path
      const file = path.join(
        this.paths.page, 
        `${document.id}.js`
      );
      //write the file to disk
      await writeFile(file, chunk.code);
      const absolute = await document.loader.absolute();
      //push the result
      results.push({
        code: 200,
        status: 'OK',
        results: {
          type: 'page',
          id: document.id,
          entry: document.entry,
          contents: chunk.code,
          source: absolute,
          destination: file
        }
      });
    }
    //return the results
    return results;
  }
}