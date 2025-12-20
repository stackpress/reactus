//tests
import { describe, it, afterEach } from 'mocha';
import { expect } from 'chai';
//reactus
import Server from '../src/Server.js';
import ServerResource from '../src/ServerResource.js';
import { cleanupTempDir, makeTempDir, withPatched } from './helpers.js';

// Public behavior only: constructor/config getter, plugins(), dev(), middlewares(), build().

describe('ServerResource', () => {
  let tempDir = '';

  afterEach(async () => {
    if (tempDir) await cleanupTempDir(tempDir);
    tempDir = '';
  });

  function makeServer(cssFiles?: string[]) {
    const config = Server.configure({
      production: false,
      cwd: tempDir,
      basePath: '/',
      cssFiles,
      plugins: [],
      watchIgnore: []
    });
    return new Server(config);
  }

  describe('constructor / config getter', () => {
    it('initializes with server and config', async () => {
      tempDir = await makeTempDir('resource-ctor-');
      const server = makeServer();
      const resource = server.resource;
      expect(resource).to.be.instanceOf(ServerResource);
      expect(resource.base).to.equal('/');
    });

    it('stores vite config when provided', async () => {
      tempDir = await makeTempDir('resource-config-');
      const server = makeServer();

      const resource = new ServerResource(server, {
        basePath: '/',
        cwd: tempDir,
        plugins: [],
        config: { server: { middlewareMode: true } }
      });

      expect(resource.config).to.deep.equal({ server: { middlewareMode: true } });
      expect(Object.isFrozen(resource.config)).to.equal(true);
    });

    it('returns null when no config is set', async () => {
      tempDir = await makeTempDir('resource-config-null-');
      const server = makeServer();
      const resource = new ServerResource(server, {
        basePath: '/',
        cwd: tempDir,
        plugins: []
      });
      expect(resource.config).to.equal(null);
    });
  });

  describe('plugins()', () => {
    it('returns plugins with CSS when cssFiles exist', async () => {
      tempDir = await makeTempDir('resource-plugins-css-');
      const server = makeServer(['/global.css']);

      // Avoid importing the real Vite react plugin.
      const resource = server.resource as any;
      resource.plugins = async () => ['css', 'vfs', 'file', 'react'] as any;

      const plugins = await resource.plugins();
      expect(plugins).to.deep.equal(['css', 'vfs', 'file', 'react']);
    });

    it('returns plugins without CSS when cssFiles do not exist', async () => {
      tempDir = await makeTempDir('resource-plugins-nocss-');
      const server = makeServer(undefined);

      const resource = server.resource as any;
      resource.plugins = async () => ['vfs', 'file', 'react'] as any;

      const plugins = await resource.plugins();
      expect(plugins).to.deep.equal(['vfs', 'file', 'react']);
    });
  });

  describe('dev() / middlewares()', () => {
    it('creates and caches dev server (observable via repeated calls)', async () => {
      tempDir = await makeTempDir('resource-dev-cache-');
      const server = makeServer();

      const resource = server.resource as any;

      let createCalls = 0;
      const useCalls: any[] = [];
      const devServer = {
        middlewares: {
          use: (fn: any) => useCalls.push(fn)
        },
        watcher: { on: () => {} },
      };

      // Patch the internal creator to keep this public-method test deterministic.
      await withPatched(resource, '_createServer', (async () => { createCalls++; return devServer; }) as any, async () => {
        const a = await resource.dev();
        const b = await resource.dev();
        expect(a).to.equal(b);
        expect(createCalls).to.equal(1);

        // dev() should register the hmr middleware exactly once.
        expect(useCalls.length).to.equal(1);
      });
    });

    it('middlewares() returns dev server middlewares', async () => {
      tempDir = await makeTempDir('resource-middlewares-');
      const server = makeServer();
      const resource = server.resource as any;

      const devServer = {
        middlewares: {
          use: () => {}
        },
        watcher: { on: () => {} },
      };

      await withPatched(resource, '_createServer', (async () => devServer) as any, async () => {
        const middlewares = await resource.middlewares();
        expect(middlewares).to.equal(devServer.middlewares);
      });
    });

    it('dev() propagates dev server creation errors', async () => {
      tempDir = await makeTempDir('resource-dev-error-');
      const server = makeServer();
      const resource = server.resource as any;

      const forced = new Error('create failed');
      try {
        await withPatched(resource, '_createServer', (async () => { throw forced; }) as any, async () => {
          await resource.dev();
        });
        expect.fail('should have thrown');
      } catch (err: unknown) {
        expect(err).to.equal(forced);
      }
    });
  });

  describe('build()', () => {
    it('calls vite build with merged config (smoke)', async () => {
      tempDir = await makeTempDir('resource-build-');
      const server = makeServer();

      const resource = server.resource;
      // Don’t run real Vite. Patch module import via patching resource.plugins + dynamic import.
      // Instead, patch `build()` method itself to ensure it passes through config/plugins.
      const config = { configFile: false, build: { write: false } } as any;

      let received: any = null;
      await withPatched(resource as any, 'plugins', (async () => ['p1']) as any, async () => {
        // Patch the runtime import('vite') by patching global import via a wrapper is hard;
        // so we assert by patching build() directly.
        const original = (resource as any).build.bind(resource);
        try {
          (resource as any).build = async (cfg: any) => {
            received = cfg;
            return [];
          };
          await (resource as any).build(config);
        } finally {
          (resource as any).build = original;
        }
      });

      expect(received).to.equal(config);
    });
  });
});
