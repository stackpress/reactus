//tests
import { describe, it } from 'mocha';
import { expect } from 'chai';
//node
import type { IncomingMessage, ServerResponse } from 'node:http';
//reactus
import { css, file, hmr, vfs } from '../src/plugins.js';
import VirtualServer from '../src/VirtualServer.js';

type Next = () => void;

describe('plugins', () => {
  describe('css()', () => {
    it('returns a Vite plugin with correct name', () => {
      const plugin = css(['/a.css']);
      expect(plugin.name).to.equal('reactus-inject-css');
    });

    it('injects CSS imports into TSX files', () => {
      const plugin = css(['/a.css', '/b.css']);
      const result = (plugin as any).transform('console.log(1)', '/x.tsx') as string;
      expect(result).to.match(/^import '\/a\.css';\nimport '\/b\.css';\n/);
      expect(result).to.include('console.log(1)');
    });

    it('does not transform non-TSX files', () => {
      const plugin = css(['/a.css']);
      const result = (plugin as any).transform('console.log(1)', '/x.ts') as string;
      expect(result).to.equal('console.log(1)');
    });

    it('handles empty CSS files array', () => {
      const plugin = css([]);
      const result = (plugin as any).transform('console.log(1)', '/x.tsx') as string;
      expect(result).to.equal('\nconsole.log(1)');
    });

    it('handles single CSS file', () => {
      const plugin = css(['/only.css']);
      const result = (plugin as any).transform('x', '/x.tsx') as string;
      expect(result).to.equal("import '/only.css';\nx");
    });
  });

  describe('file()', () => {
    it('returns a Vite plugin with correct name', () => {
      const loader = { cwd: '/cwd', resolveFile: async () => null } as const;
      const plugin = file(loader as any);
      expect(plugin.name).to.equal('reactus-file-loader');
    });

    it('skips absolute paths', async () => {
      const loader = { cwd: '/cwd', resolveFile: async () => '/x.ts' } as const;
      const plugin = file(loader as any);
      const resolved = await plugin.resolveId?.('/abs.ts');
      expect(resolved).to.equal(undefined);
    });

    it('resolves files using loader', async () => {
      let calls = 0;
      const loader = {
        cwd: '/cwd',
        resolveFile: async (_source: string) => {
          calls++;
          return '/resolved.ts';
        }
      } as const;
      const plugin = file(loader as any);
      const resolved = await plugin.resolveId?.('mod', '/importer.ts');
      expect(resolved).to.equal('/resolved.ts');
      expect(calls).to.equal(1);
    });

    it('uses cache for repeated requests', async () => {
      let calls = 0;
      const loader = {
        cwd: '/cwd',
        resolveFile: async () => {
          calls++;
          return '/resolved.ts';
        }
      } as const;

      const plugin = file(loader as any);
      await plugin.resolveId?.('mod', '/importer.ts');
      await plugin.resolveId?.('mod', '/importer.ts');
      expect(calls).to.equal(1);
    });

    it('handles importer directory resolution', async () => {
      let lastPwd = '';
      const loader = {
        cwd: '/cwd',
        resolveFile: async (_source: string, _ext: string[], pwd: string) => {
          lastPwd = pwd;
          return '/resolved.ts';
        }
      } as const;

      const plugin = file(loader as any);
      await plugin.resolveId?.('mod', '/a/b/importer.ts');
      expect(lastPwd).to.equal('/a/b');
    });

    it('handles imfs importer paths', async () => {
      let lastPwd = '';
      const loader = {
        cwd: '/cwd',
        resolveFile: async (_source: string, _ext: string[], pwd: string) => {
          lastPwd = pwd;
          return '/resolved.ts';
        }
      } as const;

      const plugin = file(loader as any);
      await plugin.resolveId?.('mod', 'imfs:text/typescript;base64,AAA;/x/y/z.tsx');
      expect(lastPwd).to.equal('/x/y');
    });

    it('returns undefined when file cannot be resolved', async () => {
      const loader = { cwd: '/cwd', resolveFile: async () => null } as const;
      const plugin = file(loader as any);
      expect(await plugin.resolveId?.('missing', '/importer.ts')).to.equal(undefined);
    });

    it('uses custom extensions', async () => {
      let extnames: string[] = [];
      const loader = {
        cwd: '/cwd',
        resolveFile: async (_source: string, ext: string[]) => {
          extnames = ext;
          return '/resolved.custom';
        }
      } as const;

      const plugin = file(loader as any, ['.abc']);
      await plugin.resolveId?.('mod', '/importer.ts');
      expect(extnames).to.deep.equal(['.abc']);
    });
  });

  describe('hmr()', () => {
    function makeRes() {
      const headers: Record<string, string> = {};
      let ended = false;
      let body = '';
      return {
        headersSent: false,
        setHeader: (k: string, v: string) => { headers[k] = v; },
        end: (v: string) => { ended = true; body = v; },
        _get: () => ({ headers, ended, body })
      } as unknown as ServerResponse<IncomingMessage> & { _get: () => { headers: Record<string, string>, ended: boolean, body: string } };
    }

    it('returns middleware function', () => {
      const server = { routes: { client: '/client' }, manifest: { find: () => null } } as any;
      const middleware = hmr(server);
      expect(middleware).to.be.a('function');
    });

    it('skips when no URL', async () => {
      const server = { routes: { client: '/client' }, manifest: { find: () => null } } as any;
      const middleware = hmr(server);

      let called = 0;
      await middleware({} as IncomingMessage, makeRes(), (() => { called++; }) as Next);
      expect(called).to.equal(1);
    });

    it('skips when URL does not start with client route', async () => {
      const server = { routes: { client: '/client' }, manifest: { find: () => null } } as any;
      const middleware = hmr(server);

      let called = 0;
      await middleware({ url: '/other/x.tsx' } as IncomingMessage, makeRes(), (() => { called++; }) as Next);
      expect(called).to.equal(1);
    });

    it('skips when URL does not end with .tsx', async () => {
      const server = { routes: { client: '/client' }, manifest: { find: () => null } } as any;
      const middleware = hmr(server);

      let called = 0;
      await middleware({ url: '/client/x.js' } as IncomingMessage, makeRes(), (() => { called++; }) as Next);
      expect(called).to.equal(1);
    });

    it('skips when headers already sent', async () => {
      const server = { routes: { client: '/client' }, manifest: { find: () => null } } as any;
      const middleware = hmr(server);

      const res = makeRes();
      (res as any).headersSent = true;

      let called = 0;
      await middleware({ url: '/client/x.tsx' } as IncomingMessage, res, (() => { called++; }) as Next);
      expect(called).to.equal(1);
    });

    it('serves HMR client when document found', async () => {
      const document = {
        render: {
          renderHMRClient: async () => 'console.log("hmr")'
        }
      } as any;

      const server = {
        routes: { client: '/client' },
        manifest: { find: () => document }
      } as any;

      const middleware = hmr(server);
      const res = makeRes();
      let called = 0;

      await middleware({ url: '/client/abc.tsx' } as IncomingMessage, res, (() => { called++; }) as Next);

      expect(called).to.equal(0);
      const state = (res as any)._get();
      expect(state.ended).to.equal(true);
      expect(state.headers['Content-Type']).to.equal('text/javascript');
      expect(state.body).to.equal('console.log("hmr")');
    });

    it('calls next when document not found', async () => {
      const server = {
        routes: { client: '/client' },
        manifest: { find: () => null }
      } as any;

      const middleware = hmr(server);
      let called = 0;
      await middleware({ url: '/client/abc.tsx' } as IncomingMessage, makeRes(), (() => { called++; }) as Next);
      expect(called).to.equal(1);
    });

    it('calls next when HMR client is null', async () => {
      const document = { render: { renderHMRClient: async () => null } } as any;
      const server = {
        routes: { client: '/client' },
        manifest: { find: () => document }
      } as any;

      const middleware = hmr(server);
      let called = 0;
      await middleware({ url: '/client/abc.tsx' } as IncomingMessage, makeRes(), (() => { called++; }) as Next);
      expect(called).to.equal(1);
    });

    it('extracts correct ID from URL', async () => {
      let received = '';
      const server = {
        routes: { client: '/client' },
        manifest: { find: (id: string) => { received = id; return null; } }
      } as any;

      const middleware = hmr(server);
      await middleware({ url: '/client/my-id.tsx' } as IncomingMessage, makeRes(), (() => {}) as Next);
      expect(received).to.equal('my-id');
    });
  });

  describe('vfs()', () => {
    it('returns a Vite plugin with correct name', () => {
      const plugin = vfs(new VirtualServer());
      expect(plugin.name).to.equal('reactus-virtual-loader');
    });

    it('resolves VFS protocol sources', () => {
      const plugin = vfs(new VirtualServer());
      const id = plugin.resolveId?.('virtual:reactus:/a.tsx');
      expect(id).to.equal('virtual:reactus:/a.tsx');
    });

    it('resolves sources containing VFS protocol', () => {
      const plugin = vfs(new VirtualServer());
      const id = plugin.resolveId?.('file:///x/virtual:reactus:/a.tsx');
      expect(id).to.equal('virtual:reactus:/a.tsx');
    });

    it('resolves relative imports from VFS files and preserves extension', () => {
      const plugin = vfs(new VirtualServer());
      const id = plugin.resolveId?.('./other', 'virtual:reactus:/a/b/file.tsx');
      expect(id).to.equal('/a/b/other.tsx');
    });

    it('loads VFS file contents', () => {
      const store = new VirtualServer();
      store.set('/a.tsx', 'export default 1');
      const plugin = vfs(store);

      const contents = plugin.load?.('virtual:reactus:/a.tsx');
      expect(contents).to.equal('export default 1');
    });

    it('returns null when VFS file does not exist', () => {
      const plugin = vfs(new VirtualServer());
      const contents = plugin.load?.('virtual:reactus:/missing.tsx');
      expect(contents).to.equal(null);
    });

    it('returns undefined for non-VFS sources in resolveId', () => {
      const plugin = vfs(new VirtualServer());
      const id = plugin.resolveId?.('react', '/a/b.tsx');
      expect(id).to.equal(undefined);
    });

    it('returns undefined for non-VFS sources in load', () => {
      const plugin = vfs(new VirtualServer());
      const contents = plugin.load?.('/a.tsx');
      expect(contents).to.equal(undefined);
    });
  });
});
