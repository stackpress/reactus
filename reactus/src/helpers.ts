//node
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
//stackpress
import type FileLoader from '@stackpress/lib/FileLoader';
//modules
import type { ViteDevServer } from 'vite';
//local
import { HASH_LENGTH, BASE62_ALPHABET } from './constants';

/**
 * Creates an id based on the given content
 */
export function id(content: string, length = HASH_LENGTH) {
  //make an md5 hash
  const md5 = crypto.createHash('md5').update(content).digest('hex');
  //Convert first 12 hex digits to a number
  let num = parseInt(md5.slice(0, 12), 16); 
  //hash buffer
  let hash = '';
  while (num > 0) {
    //Get remainder within Base62 range
    const index = num % 62; 
    hash = BASE62_ALPHABET[index] + hash;
    //Integer division
    num = Math.floor(num / 62); 
  }
  //Trim to desired length
  return hash.padStart(length, '0').slice(0, length);
}

/**
 * Returns true if the value is a native JS object
 */
export function isHash(value: unknown) {
  return typeof value === 'object' && value?.constructor?.name === 'Object';
};

/**
 * In memory file string vite plugin
 */
export function imfs() {
  return {
    //in memory file string
    name: 'imfs',
    configureServer(server: ViteDevServer) {
      server.watcher.on('change', filePath => {
        if (filePath.startsWith('imfs:')) {
          const { ws, moduleGraph: graph } = server;
          const mod = graph.getModuleById(filePath);
          if (mod) {
            graph.invalidateModule(mod);
            ws.send({ type: 'full-reload', path: '*' });
          }
        }
      });
    },
    resolveId(source: string, importer?: string) {
      //if source is an in memory file string
      if (source.startsWith('imfs:')) {
        //let it load()
        return source; 
      //if importer is an in memory file string
      } else if (importer?.startsWith('imfs:') 
        //and source is a relative path
        && (source.startsWith('./') || source.startsWith('../'))
      ) {
        //imfs:text/typescript;base64,${data};/foo/bar.tsx
        const [ _mime, _encoded, file ] = importer.substring(5).split(';');
        //resolve the source using the imfs file path
        const resolved = path.resolve(path.dirname(file), source);
        //if the resolved path has no extension
        return !path.extname(resolved) 
          //append the imfs extension of the resolved file
          //NOTE: this is because vite uses the file extension
          //to determine how to process the file (ts, jsx, etc.)
          ? resolved + path.extname(file) 
          //yay for extensions...
          : resolved;
      }
    },
    load(id: string) {
      if (id.startsWith('imfs:')) {
        //imfs:text/typescript;base64,${data};/foo/bar.tsx
        const [ _mime, encoded, _file ] = id.substring(5).split(';');
        if (encoded.startsWith('base64,')) {
          const data = encoded.substring(7);
          return Buffer.from(data, 'base64').toString();
        }
        //Let other plugins handle it
        return null; 
      }
    }
  };
}

/**
 * Node modules vite plugin
 */
export function loader(
  loader: FileLoader, 
  extnames = ['.js', '.ts', '.tsx']
) {
  const cache = new Map<string, string>();
  return {
    //resolves entry points from node_modules
    name: 'stackpress-file-loader',
    async resolveId(source: string, importer?: string) {
      //skip if absolute path
      if (source.startsWith('/')) return;
      //use cache
      if (cache.has(source)) return cache.get(source);
      //by default the pwd is the loader's current working directory
      let pwd = loader.cwd;
      //if importer is given
      if (importer) {
        //if importer is an in memory file string
        if (importer.startsWith('imfs:')) {
          //imfs:text/typescript;base64,${data};/foo/bar.tsx
          importer = importer.substring(5).split(';')[2];
        }
        //set the pwd to the importer's directory
        pwd = path.dirname(importer);
      }
      //now try to resolve the file
      const filepath = await loader.resolveFile(source, extnames, pwd);
      if (filepath) {
        cache.set(source, filepath);
        return filepath;
      }
    }
  };
}

/**
 * Creates folder if necessary and writes file
 */
export async function writeFile(
  file: string, 
  contents: string|Uint8Array<ArrayBufferLike>
) {
  const dirname = path.dirname(file);
  //if the folder doesn't exist, create it
  if (!await fs.stat(dirname).catch(() => false)) {
    await fs.mkdir(dirname, { recursive: true });
  }
  //now cache the tsx code
  await fs.writeFile(file, contents);
  return file;
}