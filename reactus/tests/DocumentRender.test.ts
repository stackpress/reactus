//tests
import { describe, it, afterEach } from 'mocha';
import { expect } from 'chai';
//node
import path from 'node:path';
//modules
import React from 'react';
//reactus
import Server from '../src/Server.js';
import DocumentRender from '../src/DocumentRender.js';
import Exception from '../src/Exception.js';
import { cleanupTempDir, makeTempDir, withPatched } from './helpers.js';

describe('DocumentRender', () => {
  let tempDir = '';

  afterEach(async () => {
    if (tempDir) await cleanupTempDir(tempDir);
    tempDir = '';
  });

  function makeServer(production: boolean) {
    const config = Server.configure({
      production,
      cwd: tempDir,
      basePath: '/',
      clientRoute: '/client',
      cssRoute: '/assets',
      plugins: []
    });

    return new Server(config);
  }

  function makeDocument(server: Server, entry = '@/pages/home.tsx') {
    const document = {
      id: 'home-123',
      entry,
      server,
      loader: {
        import: async () => ({
          default: (props: { message?: string }) => React.createElement('div', null, props.message || 'Hello'),
          Head: (props: { styles?: string[] }) => React.createElement(
            'head',
            null,
            (props.styles || []).map((href) => React.createElement('link', { key: href, rel: 'stylesheet', href }))
          ),
          styles: ['a.css', 'b.css']
        }),
        absolute: async () => path.join(tempDir, 'pages', 'home.tsx'),
        relative: async (_fromFile: string) => './pages/home.tsx'
      }
    } as any;

    return document;
  }

  describe('constructor', () => {
    it('initializes with document and server references', async () => {
      tempDir = await makeTempDir('docrender-ctor-');
      const server = makeServer(true);
      const doc = makeDocument(server);
      const render = new DocumentRender(doc);
      expect(render).to.be.instanceOf(DocumentRender);
    });
  });

  describe('renderHMRClient()', () => {
    it('renders HMR client code successfully', async () => {
      tempDir = await makeTempDir('docrender-hmr-');
      const server = makeServer(false);
      const doc = makeDocument(server);
      const render = new DocumentRender(doc);

      // Stub VFS set so we can verify it was used.
      let vfsFile = '';
      (server.vfs as any).set = (file: string, code: string) => {
        vfsFile = file;
        return `virtual:reactus:${file}`;
      };

      // Fake Vite dev server that returns transformed code.
      const dev = {
        transformRequest: async (_url: string) => ({ code: '/*hmr*/' }),
        transformIndexHtml: async (_url: string, html: string) => html,
        middlewares: (_req: any, _res: any, next: any) => next(),
        watcher: { on: () => {} },
      };

      await withPatched(server.resource as any, 'dev', (async () => dev) as any, async () => {
        const code = await render.renderHMRClient();
        expect(code).to.equal('/*hmr*/');
        expect(vfsFile).to.match(/\.hmr\.tsx$/);
      });
    });

    it('throws exception when transformation returns null', async () => {
      tempDir = await makeTempDir('docrender-hmr-null-');
      const server = makeServer(false);
      const doc = makeDocument(server);
      const render = new DocumentRender(doc);

      const dev = {
        transformRequest: async () => null,
        transformIndexHtml: async (_url: string, html: string) => html,
        middlewares: (_req: any, _res: any, next: any) => next(),
        watcher: { on: () => {} },
      };

      try {
        await withPatched(server.resource as any, 'dev', (async () => dev) as any, async () => {
          await render.renderHMRClient();
        });
        expect.fail('should have thrown');
      } catch (err: unknown) {
        expect(err).to.be.instanceOf(Exception);
      }
    });

    it('propagates transformation errors', async () => {
      tempDir = await makeTempDir('docrender-hmr-err-');
      const server = makeServer(false);
      const doc = makeDocument(server);
      const render = new DocumentRender(doc);

      const forced = new Error('transform failed');
      const dev = {
        transformRequest: async () => { throw forced; },
        transformIndexHtml: async (_url: string, html: string) => html,
        middlewares: (_req: any, _res: any, next: any) => next(),
        watcher: { on: () => {} },
      };

      try {
        await withPatched(server.resource as any, 'dev', (async () => dev) as any, async () => {
          await render.renderHMRClient();
        });
        expect.fail('should have thrown');
      } catch (err: unknown) {
        expect(err).to.equal(forced);
      }
    });
  });

  describe('renderMarkup()', () => {
    it('renders production markup when in production mode', async () => {
      tempDir = await makeTempDir('docrender-prod-');
      const server = makeServer(true);
      const doc = makeDocument(server);
      const render = new DocumentRender(doc);

      const html = await render.renderMarkup({ message: 'Hi' });
      expect(html).to.include('Hi');
      expect(html).to.include('<script type="module" src="/client/home-123.js"></script>');
      expect(html).to.include('/assets/a.css');
      expect(html).to.include('/assets/b.css');
    });

    it('renders development markup when in development mode', async () => {
      tempDir = await makeTempDir('docrender-dev-');
      const server = makeServer(false);
      const doc = makeDocument(server);
      const render = new DocumentRender(doc);

      const dev = {
        transformIndexHtml: async (_url: string, html: string) => html + '<!--vite-->',
        transformRequest: async () => ({ code: '/*hmr*/' }),
        middlewares: (_req: any, _res: any, next: any) => next(),
        watcher: { on: () => {} },
      };

      const html = await withPatched(server.resource as any, 'dev', (async () => dev) as any, async () => {
        return await render.renderMarkup({ message: 'Dev' });
      });

      expect(html).to.include('Dev');
      expect(html).to.include('<!--vite-->');
      expect(html).to.include('<script type="module" src="/client/home-123.tsx"></script>');
    });

    it('handles empty props', async () => {
      tempDir = await makeTempDir('docrender-empty-props-');
      const server = makeServer(true);
      const doc = makeDocument(server);
      const render = new DocumentRender(doc);

      const html = await render.renderMarkup();
      expect(html).to.include('Hello');
    });

    it('handles missing Head component', async () => {
      tempDir = await makeTempDir('docrender-no-head-');
      const server = makeServer(true);
      const doc = makeDocument(server);
      (doc.loader as any).import = async () => ({
        default: () => React.createElement('div', null, 'Body')
      });
      const render = new DocumentRender(doc);

      const html = await render.renderMarkup();
      expect(html).to.include('Body');
    });

    it('handles missing styles', async () => {
      tempDir = await makeTempDir('docrender-no-styles-');
      const server = makeServer(true);
      const doc = makeDocument(server);
      (doc.loader as any).import = async () => ({
        default: () => React.createElement('div', null, 'Body'),
        Head: () => React.createElement('head', null)
      });
      const render = new DocumentRender(doc);

      const html = await render.renderMarkup();
      expect(html).to.include('Body');
      expect(html).to.not.include('/assets/');
    });
  });

  describe('error handling', () => {
    it('propagates loader import errors', async () => {
      tempDir = await makeTempDir('docrender-import-error-');
      const server = makeServer(true);
      const doc = makeDocument(server);
      const forced = new Error('import failed');
      (doc.loader as any).import = async () => { throw forced; };

      const render = new DocumentRender(doc);
      try {
        await render.renderMarkup();
        expect.fail('should have thrown');
      } catch (err: unknown) {
        expect(err).to.equal(forced);
      }
    });

    it('propagates dev server errors', async () => {
      tempDir = await makeTempDir('docrender-dev-error-');
      const server = makeServer(false);
      const doc = makeDocument(server);
      const render = new DocumentRender(doc);

      const forced = new Error('dev failed');
      try {
        await withPatched(server.resource as any, 'dev', (async () => { throw forced; }) as any, async () => {
          await render.renderMarkup();
        });
        expect.fail('should have thrown');
      } catch (err: unknown) {
        expect(err).to.equal(forced);
      }
    });

    it('propagates VFS errors', async () => {
      tempDir = await makeTempDir('docrender-vfs-error-');
      const server = makeServer(false);
      const doc = makeDocument(server);
      const render = new DocumentRender(doc);

      const forced = new Error('vfs failed');
      (server.vfs as any).set = () => { throw forced; };

      const dev = {
        transformRequest: async () => ({ code: '/*hmr*/' }),
        transformIndexHtml: async (_url: string, html: string) => html,
        middlewares: (_req: any, _res: any, next: any) => next(),
        watcher: { on: () => {} },
      };

      try {
        await withPatched(server.resource as any, 'dev', (async () => dev) as any, async () => {
          await render.renderHMRClient();
        });
        expect.fail('should have thrown');
      } catch (err: unknown) {
        expect(err).to.equal(forced);
      }
    });

    it('propagates loader absolute path errors', async () => {
      tempDir = await makeTempDir('docrender-abs-error-');
      const server = makeServer(false);
      const doc = makeDocument(server);
      const render = new DocumentRender(doc);

      const forced = new Error('absolute failed');
      (doc.loader as any).absolute = async () => { throw forced; };

      const dev = {
        transformRequest: async () => ({ code: '/*hmr*/' }),
        transformIndexHtml: async (_url: string, html: string) => html,
        middlewares: (_req: any, _res: any, next: any) => next(),
        watcher: { on: () => {} },
      };

      try {
        await withPatched(server.resource as any, 'dev', (async () => dev) as any, async () => {
          await render.renderHMRClient();
        });
        expect.fail('should have thrown');
      } catch (err: unknown) {
        expect(err).to.equal(forced);
      }
    });
  });
});
