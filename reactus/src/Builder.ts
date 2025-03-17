//node
import path from 'node:path';
//modules
import type { PluginOption } from 'vite';
//local
import type { BuildStatus } from './types';
import Manifest from './Manifest';
import Exception from './Exception';
import { writeFile } from './helpers';

export default class Builder extends Manifest {
  /**
   * Builds and saves the assets used from all the documents
   */
  public async buildAssets(plugins: PluginOption[] = []) {
    //buffer for the build status results
    const results: BuildStatus[] = [];
    //loop through all the documents
    for (const document of this.values()) {
      //this gives the page component source code (js) and assets
      const page = await document.getAssets(plugins);
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
  public async buildClient(plugins: PluginOption[] = []) {
    //buffer for the build status results
    const results: BuildStatus[] = [];
    //loop through all the documents
    for (const document of this.values()) {
      //this just gives the entry code (js) (chunk)
      const client = await document.getClient(plugins);
      //if the output is not an array
      if (!Array.isArray(client)) {
        //push an error
        results.push(Exception.for(
          `Client '${document.entry}' was not generated`
        ).withCode(500).toResponse());
        //do not do anything else
        continue;
      }
      //find the output with type chunk
      const chunk = client.find(
        output => output.type === 'chunk'
      );
      //if a chunk was not found
      if (!chunk) {
        //push an error
        results.push(Exception.for(
          `Client '${document.entry}' was not generated`
        ).withCode(404).toResponse());
        //skip the rest...
        continue;
      }
      //determine the file path
      const file = path.join(
        this.paths.client, 
        `${document.id}.js`
      );
      //write the file to disk
      await writeFile(file, chunk.code);
      //push the result
      results.push({
        code: 200,
        status: 'OK',
        results: {
          type: 'client',
          id: document.id,
          entry: document.entry,
          contents: chunk.code,
          source: this.loader.absolute(document.entry),
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
  public async buildPages(plugins: PluginOption[] = []) {
    //buffer for the build status results
    const results: BuildStatus[] = [];
    //loop through all the documents
    for (const document of this.values()) {
      //this gives the page component source code (js) and assets
      const page = await document.getPage(plugins);
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
      //push the result
      results.push({
        code: 200,
        status: 'OK',
        results: {
          type: 'page',
          id: document.id,
          entry: document.entry,
          contents: chunk.code,
          source: this.loader.absolute(document.entry),
          destination: file
        }
      });
    }
    //return the results
    return results;
  }
}