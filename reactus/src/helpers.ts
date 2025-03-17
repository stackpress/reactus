//node
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
//modules
import type { ViteDevServer } from 'vite';
//local
import { HASH_LENGTH, BASE62_ALPHABET } from './constants';

/**
 * Creates an id based on the given content
 */
export function id(content: string, length = HASH_LENGTH) {
  //make an md5 hash
  const md5 = crypto.createHash('md5').update(content).digest();
  // Convert MD5 hash to BigInt
  let num = BigInt(`0x${md5.toString('hex')}`); 
  //hash buffer
  let hash = '';
  while (num > 0n) {
    const index = Number(num % 62n);
    hash = BASE62_ALPHABET[index] + hash;
    num /= 62n;
  }
  // Trim to desired length
  return hash.slice(0, length); 
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
        // Let other plugins handle it
        return null; 
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