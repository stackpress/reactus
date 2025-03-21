//node
import path from 'node:path';
//stackpress
import type { CallableMap } from '@stackpress/lib/types';
//modules
import type { ViteDevServer } from 'vite';
//server
import type ServerLoader from './server/Loader';
//local
import type { IM, SR, Next } from './types';
import type Server from './Server';

/**
 * css loader
 */
export function css(styles?: string) {
  return styles ? {
    //resolves entry points from node_modules
    name: 'reactus-css-loader',
    async load(source: string) {
      //`/foo/bar/.tailwind/${this.id}.css`
      if (source.includes('.css/') && source.endsWith('.css')) {
        return styles;
      }
    }
  }: null;
}

/**
 * Node modules vite plugin
 */
export function file(
  loader: ServerLoader, 
  extnames = ['.js', '.ts', '.tsx']
) {
  const cache = new Map<string, string>();
  return {
    //resolves entry points from node_modules
    name: 'reactus-file-loader',
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
 * hmr client plugin
 */
export function hmr(server: Server) {
  const { routes, manifest } = server;
  return async (req: IM, res: SR, next: Next) => {
    //if no url
    if (!req.url 
      //or request is not for client assets
      || !req.url.startsWith(routes.client) 
      //or not a tsx request
      || !req.url.endsWith('.tsx') 
      //or response was already sent
      || res.headersSent
    ) {
      //skip
      next();
      return;
    }
    //example url: /client/abc-123.tsx
    const id = req.url.slice(routes.client.length + 1, -4);
    const document = manifest.find(id);
    if (document) {
      const client = await document.render.renderHMRClient();
      if (client) {
        res.setHeader('Content-Type', 'text/javascript');
        res.end(client);
        return;
      }
    }
    //nothing caught
    next();
  };
}

/**
 * Virtual file system
 */
export function vfs(cache: CallableMap<string, string>) {
  return {
    //in memory file string
    name: 'reactus-vfs-loader',
    configureServer(server: ViteDevServer) {
      server.watcher.on('change', filePath => {
        if (filePath.startsWith('vfs:')) {
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
      if (source.startsWith('vfs:')) {
        //let it load()
        return source; 
      //if importer is an in memory file string
      } else if (importer?.startsWith('vfs:') 
        //and source is a relative path
        && (source.startsWith('./') || source.startsWith('../'))
      ) {
        //vfs:/foo/bar.tsx
        const file = importer.substring(4);
        //resolve the source using the vfa file path
        const resolved = path.resolve(path.dirname(file), source);
        //if the resolved path has no extension
        return !path.extname(resolved) 
          //append the vfs extension of the resolved file
          //NOTE: this is because vite uses the file extension
          //to determine how to process the file (ts, jsx, etc.)
          ? resolved + path.extname(file) 
          //yay for extensions...
          : resolved;
      }
    },
    load(id: string) {
      if (id.startsWith('vfs:')) {
        //vfs:/foo/bar.tsx
        const file = id.substring(4);
        if (cache.has(file)) {
          const data = cache.get(file) as string;
          return Buffer.from(data, 'base64').toString();
        }
        //Let other plugins handle it
        return null; 
      }
    }
  };
}