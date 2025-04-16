//node
import path from 'node:path';
//modules
import type { Plugin, ViteDevServer } from 'vite';
//server
import type ServerLoader from './ServerLoader.js';
import type VirtualServer from './VirtualServer.js';
//local
import type { IM, SR, Next } from './types.js';
import type Server from './Server.js';
import { VFS_PROTOCOL } from './constants.js';

export function css(cssFiles: string[]) {
  return {
    name: 'reactus-inject-css',
    enforce: 'pre', // Ensure this runs before other transforms
    transform(code: string, id: string) {
      // Only process TypeScript files
      if (id.endsWith('.tsx')) {
        // Inject the CSS import at the top of the file
        const imports = cssFiles.map(css => `import '${css}';`);
        return imports.join('\n') + '\n' + code;
      }
      return code;
    },
  } as Plugin;
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
export function vfs(vfs: VirtualServer) {
  return {
    //in memory file string
    name: 'reactus-virtual-loader',
    configureServer(server: ViteDevServer) {
      server.watcher.on('change', filePath => {
        if (filePath.startsWith(VFS_PROTOCOL)) {
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
      if (source.startsWith(VFS_PROTOCOL)) {
        //let it load()
        return source; 
      //if importer is an in memory file string
      } else if (source.includes(VFS_PROTOCOL)) {
        return source.substring(source.indexOf(VFS_PROTOCOL));
      //if importer is an in memory file string
      } else if (importer?.startsWith(VFS_PROTOCOL) 
        //and source is a relative path
        && (source.startsWith('./') || source.startsWith('../'))
      ) {
        //virtual:reactus:/foo/bar.tsx
        const file = importer.substring(VFS_PROTOCOL.length);
        //resolve the source using the vfs file path
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
      if (id.startsWith(VFS_PROTOCOL)) {
        //virtual:reactus:/foo/bar.tsx
        const file = id.substring(VFS_PROTOCOL.length);
        if (vfs.has(file)) {
          const contents = vfs.get(file);
          if (typeof contents === 'string') {
            return contents;
          }
        }
        //Let other plugins handle it
        return null; 
      }
    }
  };
}