//tests
import { describe, it, afterEach } from 'mocha';
import { expect } from 'chai';
//node
import path from 'node:path';
//reactus
import Server from '../src/Server.js';
import DocumentLoader from '../src/DocumentLoader.js';
import { cleanupTempDir, makeTempDir, withPatched } from './helpers.js';

describe('DocumentLoader', () => {
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
      plugins: []
    });

    return new Server(config);
  }

  function makeDocument(server: Server, entry: string) {
    return {
      id: 'doc-1',
      entry,
      server,
    } as any;
  }

  describe('constructor', () => {
    it('initializes with document and server references', async () => {
      tempDir = await makeTempDir('docloader-ctor-');
      const server = makeServer(true);
      const doc = makeDocument(server, '@/pages/home.tsx');

      const loader = new DocumentLoader(doc);
      expect(loader).to.be.instanceOf(DocumentLoader);
    });
  });

  describe('absolute()', () => {
    it('returns absolute path from server loader', async () => {
      tempDir = await makeTempDir('docloader-absolute-');
      const server = makeServer(true);
      const doc = makeDocument(server, '@/pages/home.tsx');
      const loader = new DocumentLoader(doc);

      const absolute = await loader.absolute();
      // FileLoader.absolute resolves @/ relative to cwd
      expect(absolute).to.equal(path.join(tempDir, 'pages', 'home.tsx'));
    });

    it('handles module paths by delegating to server loader', async () => {
      tempDir = await makeTempDir('docloader-absolute-module-');
      const server = makeServer(true);
      const doc = makeDocument(server, 'some-module/pages/home.tsx');
      const loader = new DocumentLoader(doc);

      // For module-ish paths, absolute() will attempt to resolve via node_modules,
      // but even if not found it should still return a string.
      const absolute = await loader.absolute();
      expect(absolute).to.be.a('string');
    });
  });

  describe('import()', () => {
    describe('in production mode', () => {
      it('imports from built pagePath/<id>.js using server loader.import()', async () => {
        tempDir = await makeTempDir('docloader-import-prod-');
        const server = makeServer(true);
        const doc = makeDocument(server, '@/pages/home.tsx');
        (doc as any).id = 'home-123';

        const loader = new DocumentLoader(doc);

        const expectedFile = path.join(server.paths.page, 'home-123.js');

        let receivedPath = '';
        await withPatched(server.loader as any, 'import', (async (pathname: string) => {
          receivedPath = pathname;
          return { default: () => null };
        }) as any, async () => {
          const mod = await loader.import();
          expect(mod).to.have.property('default');
        });

        expect(receivedPath).to.equal(expectedFile);
      });

      it('propagates errors from server loader import()', async () => {
        tempDir = await makeTempDir('docloader-import-prod-error-');
        const server = makeServer(true);
        const doc = makeDocument(server, '@/pages/home.tsx');
        (doc as any).id = 'home-123';

        const loader = new DocumentLoader(doc);

        const forced = new Error('import failed');
        try {
          await withPatched(server.loader as any, 'import', (async () => { throw forced; }) as any, async () => {
            await loader.import();
          });
          expect.fail('should have thrown');
        } catch (err: unknown) {
          expect(err).to.equal(forced);
        }
      });
    });

    describe('in development mode', () => {
      it('resolves entry file then fetches via dev server (file:// URL)', async () => {
        tempDir = await makeTempDir('docloader-import-dev-');
        const server = makeServer(false);
        const doc = makeDocument(server, '@/pages/home.tsx');
        const loader = new DocumentLoader(doc);

        const resolvedFile = path.join(tempDir, 'pages', 'home.tsx');
        let resolveCalled = 0;
        let fetchCalledWith = '';

        await withPatched(server.loader as any, 'resolve', (async () => {
          resolveCalled++;
          return { filepath: resolvedFile, basepath: resolvedFile.replace(/\.tsx$/, ''), extname: '.tsx' };
        }) as any, async () => {
          await withPatched(server.loader as any, 'fetch', (async (url: string) => {
            fetchCalledWith = url;
            return { default: () => null };
          }) as any, async () => {
            const mod = await loader.import();
            expect(mod).to.have.property('default');
          });
        });

        expect(resolveCalled).to.equal(1);
        expect(fetchCalledWith).to.equal(`file://${resolvedFile}`);
      });

      it('propagates errors from server loader resolve()', async () => {
        tempDir = await makeTempDir('docloader-import-dev-resolve-error-');
        const server = makeServer(false);
        const doc = makeDocument(server, '@/pages/home.tsx');
        const loader = new DocumentLoader(doc);

        const forced = new Error('resolve failed');
        try {
          await withPatched(server.loader as any, 'resolve', (async () => { throw forced; }) as any, async () => {
            await loader.import();
          });
          expect.fail('should have thrown');
        } catch (err: unknown) {
          expect(err).to.equal(forced);
        }
      });

      it('propagates errors from server loader fetch()', async () => {
        tempDir = await makeTempDir('docloader-import-dev-fetch-error-');
        const server = makeServer(false);
        const doc = makeDocument(server, '@/pages/home.tsx');
        const loader = new DocumentLoader(doc);

        const resolvedFile = path.join(tempDir, 'pages', 'home.tsx');
        const forced = new Error('fetch failed');

        await withPatched(server.loader as any, 'resolve', (async () => {
          return { filepath: resolvedFile, basepath: resolvedFile.replace(/\.tsx$/, ''), extname: '.tsx' };
        }) as any, async () => {
          try {
            await withPatched(server.loader as any, 'fetch', (async () => { throw forced; }) as any, async () => {
              await loader.import();
            });
            expect.fail('should have thrown');
          } catch (err: unknown) {
            expect(err).to.equal(forced);
          }
        });
      });
    });
  });

  describe('relative()', () => {
    it('returns relative path for @ prefixed entries', async () => {
      tempDir = await makeTempDir('docloader-relative-');
      const server = makeServer(true);
      const doc = makeDocument(server, '@/pages/home.tsx');
      const loader = new DocumentLoader(doc);

      const fromFile = path.join(tempDir, 'pages', 'home.tsx.page.tsx');
      const relative = await loader.relative(fromFile);

      // ServerLoader.relative() defaults to `withExtname=false` (extension removed).
      expect(relative).to.equal('./home');
    });

    it('returns entry as-is for module paths', async () => {
      tempDir = await makeTempDir('docloader-relative-module-');
      const server = makeServer(true);
      const doc = makeDocument(server, 'some-module/pages/home.tsx');
      const loader = new DocumentLoader(doc);

      const relative = await loader.relative('/any/file.tsx');
      expect(relative).to.equal('some-module/pages/home.tsx');
    });

    it('returns a stable relative path regardless of platform separators', async () => {
      tempDir = await makeTempDir('docloader-relative-platform-');
      const server = makeServer(true);
      const doc = makeDocument(server, '@/pages/home.tsx');
      const loader = new DocumentLoader(doc);

      // Use the current platform separator behavior.
      const fromFile = path.join(tempDir, 'pages', 'page.tsx');
      const relative = await loader.relative(fromFile);

      // Extension removed by default.
      expect(relative).to.equal('./home');
    });

    it('handles relative paths that do not start with @ by returning entry as-is', async () => {
      tempDir = await makeTempDir('docloader-relative-dot-');
      const server = makeServer(true);
      const doc = makeDocument(server, './pages/home.tsx');
      const loader = new DocumentLoader(doc);

      const relative = await loader.relative('/any/file.tsx');
      expect(relative).to.equal('./pages/home.tsx');
    });

    it('handles absolute paths that do not start with @ by returning entry as-is', async () => {
      tempDir = await makeTempDir('docloader-relative-abs-');
      const server = makeServer(true);
      const doc = makeDocument(server, '/abs/pages/home.tsx');
      const loader = new DocumentLoader(doc);

      const relative = await loader.relative('/any/file.tsx');
      expect(relative).to.equal('/abs/pages/home.tsx');
    });
  });

  describe('error handling', () => {
    it('propagates errors from server loader absolute() method', async () => {
      tempDir = await makeTempDir('docloader-abs-error-');
      const server = makeServer(true);
      const doc = makeDocument(server, '@/pages/home.tsx');
      const loader = new DocumentLoader(doc);

      const forced = new Error('absolute failed');
      try {
        await withPatched(server.loader as any, 'absolute', (async () => { throw forced; }) as any, async () => {
          await loader.absolute();
        });
        expect.fail('should have thrown');
      } catch (err: unknown) {
        expect(err).to.equal(forced);
      }
    });
  });
});
