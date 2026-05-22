//tests
import { describe, it, afterEach } from 'mocha';
import { expect } from 'chai';
//node
import fs from 'node:fs/promises';
import path from 'node:path';
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
      const plugins = (await server.resource.plugins()).flat() as any[];
      const names = plugins.filter(Boolean).map(plugin => plugin.name);

      expect(names).to.include('reactus-inject-css');
      expect(names).to.include('reactus-virtual-loader');
      expect(names).to.include('reactus-file-loader');
      expect(names.some(name => name.startsWith('vite:react'))).to.equal(true);
    });

    it('returns plugins without CSS when cssFiles do not exist', async () => {
      tempDir = await makeTempDir('resource-plugins-nocss-');
      const server = makeServer(undefined);
      const plugins = (await server.resource.plugins()).flat();
      expect(plugins.every(plugin => plugin !== null)).to.equal(true);
      const names = (plugins as any[]).map(plugin => plugin.name);
      expect(names).to.not.include('reactus-inject-css');
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
    it('calls vite build with merged config and plugin output', async () => {
      tempDir = await makeTempDir('resource-build-');
      const server = makeServer();
      const entry = path.join(tempDir, 'entry.js');
      await fs.writeFile(entry, 'export default "ok";');

      const resource = server.resource;
      let started = 0;
      const config = {
        configFile: false,
        build: {
          write: false,
          rollupOptions: {
            input: entry
          }
        }
      } as any;

      await withPatched(resource as any, 'plugins', (async () => [{
        name: 'capture-plugin',
        buildStart() {
          started++;
        }
      }]) as any, async () => {
        const result = await resource.build(config);
        expect(result).to.have.property('output');
      });

      expect(started).to.equal(1);
    });

    it('creates a vite dev server with the expected config wiring', async () => {
      tempDir = await makeTempDir('resource-create-server-');
      const server = new Server(Server.configure({
        production: false,
        cwd: tempDir,
        basePath: '/app/',
        plugins: [],
        watchIgnore: ['**/*.tmp'],
        optimizeDeps: { exclude: ['react'] }
      }));

      const resource = server.resource as any;
      const devServer = await withPatched(resource, 'plugins', (async () => [{ name: 'test-plugin' }]) as any, async () => {
        return await resource._createServer();
      });

      try {
        expect(devServer.config.base).to.equal('/app/');
        expect(devServer.config.root).to.equal(tempDir);
        expect(devServer.config.mode).to.equal('development');
        expect(devServer.config.appType).to.equal('custom');
        expect(devServer.config.server.middlewareMode).to.equal(true);
        expect(devServer.config.server.watch.ignored).to.deep.equal(['**/*.tmp']);
        expect(devServer.config.optimizeDeps.exclude).to.deep.equal(['react']);
        expect(devServer.config.plugins.some((plugin: { name: string }) => plugin.name === 'test-plugin')).to.equal(true);
      } finally {
        await devServer.close();
      }
    });
  });
});
