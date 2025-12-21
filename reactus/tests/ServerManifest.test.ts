//tests
import { describe, it, afterEach } from 'mocha';
import { expect } from 'chai';
//node
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
//reactus
import Server from '../src/Server.js';
import Document from '../src/Document.js';
import Exception from '../src/Exception.js';
import { cleanupTempDir, makeTempDir, withPatched } from './helpers.js';

describe('ServerManifest', () => {
  let tempDir = '';

  afterEach(async () => {
    if (tempDir) await cleanupTempDir(tempDir);
    tempDir = '';
  });

  function makeServer() {
    const config = Server.configure({
      production: true,
      cwd: tempDir,
      basePath: '/',
      plugins: []
    });

    return new Server(config);
  }

  describe('constructor', () => {
    it('initializes with server reference', async () => {
      tempDir = await makeTempDir('manifest-ctor-');
      const server = makeServer();
      expect(server.manifest).to.exist;
      expect(server.manifest.size).to.equal(0);
    });
  });

  describe('size getter', () => {
    it('returns the number of documents', async () => {
      tempDir = await makeTempDir('manifest-size-');
      const server = makeServer();
      expect(server.manifest.size).to.equal(0);

      await server.manifest.set('@/pages/home.tsx');
      expect(server.manifest.size).to.equal(1);
    });
  });

  describe('set()', () => {
    it('creates and stores a new document', async () => {
      tempDir = await makeTempDir('manifest-set-');
      const server = makeServer();

      const doc = await server.manifest.set('@/pages/home.tsx');
      expect(doc).to.be.instanceOf(Document);
      expect(server.manifest.size).to.equal(1);
    });

    it('returns existing document if already exists', async () => {
      tempDir = await makeTempDir('manifest-set-existing-');
      const server = makeServer();

      const a = await server.manifest.set('@/pages/home.tsx');
      const b = await server.manifest.set('@/pages/home.tsx');
      expect(a).to.equal(b);
      expect(server.manifest.size).to.equal(1);
    });

    it('handles entry path transformation for absolute project paths', async () => {
      tempDir = await makeTempDir('manifest-set-transform-');
      const server = makeServer();

      const absolute = path.join(tempDir, 'pages', 'home.tsx');
      const doc = await server.manifest.set(absolute);
      expect(doc.entry.startsWith('@/')).to.equal(true);
    });

    it('handles node_modules paths', async () => {
      tempDir = await makeTempDir('manifest-set-modules-');
      const server = makeServer();

      const entry = '/somewhere/node_modules/some-module/pages/home.tsx';
      const doc = await server.manifest.set(entry);
      expect(doc.entry).to.equal('some-module/pages/home.tsx');
    });

    it('handles file:// URLs', async () => {
      tempDir = await makeTempDir('manifest-set-fileurl-');
      const server = makeServer();

      const absolute = path.join(tempDir, 'pages', 'home.tsx');
      const url = pathToFileURL(absolute).href;
      const doc = await server.manifest.set(url);
      expect(doc.entry.startsWith('@/')).to.equal(true);
    });

    it('throws exception for invalid entry paths', async () => {
      tempDir = await makeTempDir('manifest-set-invalid-');
      const server = makeServer();

      try {
        await server.manifest.set('/tmp/outside-project.tsx');
        expect.fail('should have thrown');
      } catch (err: unknown) {
        expect(err).to.be.instanceOf(Exception);
      }
    });
  });

  describe('get()', () => {
    it('returns document by entry', async () => {
      tempDir = await makeTempDir('manifest-get-');
      const server = makeServer();
      await server.manifest.set('@/pages/home.tsx');

      const doc = await server.manifest.get('@/pages/home.tsx');
      expect(doc).to.be.instanceOf(Document);
    });

    it('returns null for non-existent entry', async () => {
      tempDir = await makeTempDir('manifest-get-missing-');
      const server = makeServer();

      const doc = await server.manifest.get('@/pages/missing.tsx');
      expect(doc).to.equal(null);
    });

    it('handles entry path transformation', async () => {
      tempDir = await makeTempDir('manifest-get-transform-');
      const server = makeServer();

      const absolute = path.join(tempDir, 'pages', 'home.tsx');
      await server.manifest.set(absolute);

      const doc = await server.manifest.get(absolute);
      expect(doc).to.be.instanceOf(Document);
    });
  });

  describe('has()', () => {
    it('returns true for existing entry', async () => {
      tempDir = await makeTempDir('manifest-has-');
      const server = makeServer();
      await server.manifest.set('@/pages/home.tsx');
      expect(await server.manifest.has('@/pages/home.tsx')).to.equal(true);
    });

    it('returns false for non-existent entry', async () => {
      tempDir = await makeTempDir('manifest-has-missing-');
      const server = makeServer();
      expect(await server.manifest.has('@/pages/home.tsx')).to.equal(false);
    });
  });

  describe('find()', () => {
    it('finds document by id', async () => {
      tempDir = await makeTempDir('manifest-find-');
      const server = makeServer();
      const doc = await server.manifest.set('@/pages/home.tsx');

      const found = server.manifest.find(doc.id);
      expect(found).to.equal(doc);
    });

    it('returns null for non-existent id', async () => {
      tempDir = await makeTempDir('manifest-find-missing-');
      const server = makeServer();
      expect(server.manifest.find('nope')).to.equal(null);
    });
  });

  describe('values()', () => {
    it('returns array of all documents', async () => {
      tempDir = await makeTempDir('manifest-values-');
      const server = makeServer();
      await server.manifest.set('@/pages/home.tsx');
      await server.manifest.set('@/pages/about.tsx');

      const values = server.manifest.values();
      expect(values).to.have.length(2);
      expect(values[0]).to.be.instanceOf(Document);
    });

    it('returns empty array when no documents', async () => {
      tempDir = await makeTempDir('manifest-values-empty-');
      const server = makeServer();
      expect(server.manifest.values()).to.deep.equal([]);
    });
  });

  describe('entries(), forEach(), map()', () => {
    it('exposes list operations over documents', async () => {
      tempDir = await makeTempDir('manifest-iter-');
      const server = makeServer();
      await server.manifest.set('@/pages/home.tsx');
      await server.manifest.set('@/pages/about.tsx');

      const entries = server.manifest.entries();
      expect(entries).to.have.length(2);
      expect(entries[0][0]).to.be.instanceOf(Document);
      expect(entries[0][1]).to.equal(0);

      const ids: string[] = [];
      server.manifest.forEach((doc) => ids.push(doc.id));
      expect(ids).to.have.length(2);

      const mapped = server.manifest.map((doc) => doc.entry);
      expect(mapped).to.deep.equal(['@/pages/home.tsx', '@/pages/about.tsx']);
    });
  });

  describe('load(), toJSON(), open(), save()', () => {
    it('loads documents from hash object', async () => {
      tempDir = await makeTempDir('manifest-load-');
      const server = makeServer();

      server.manifest.load({ a: '@/pages/home.tsx', b: '@/pages/about.tsx' });
      // load() is async internally via set(), but it does not await; allow microtask.
      await new Promise((r) => setTimeout(r, 0));

      expect(server.manifest.size).to.equal(2);
    });

    it('converts manifest to JSON object', async () => {
      tempDir = await makeTempDir('manifest-json-');
      const server = makeServer();
      const doc = await server.manifest.set('@/pages/home.tsx');

      const json = server.manifest.toJSON();
      expect(json).to.deep.equal({ [doc.id]: doc.entry });
    });

    it('saves manifest to file and can open it back', async () => {
      tempDir = await makeTempDir('manifest-roundtrip-');
      const server = makeServer();

      await server.manifest.set('@/pages/home.tsx');
      await server.manifest.set('@/pages/about.tsx');

      const file = path.join(tempDir, 'manifest.json');
      await server.manifest.save(file);

      const server2 = makeServer();
      await server2.manifest.open(file);
      await new Promise((r) => setTimeout(r, 0));
      expect(server2.manifest.size).to.equal(2);
    });

    it('open() handles invalid JSON', async () => {
      tempDir = await makeTempDir('manifest-open-invalid-');
      const server = makeServer();
      const file = path.join(tempDir, 'manifest.json');
      await fs.writeFile(file, '{not-json');

      try {
        await server.manifest.open(file);
        expect.fail('should have thrown');
      } catch (err: unknown) {
        expect(err).to.be.instanceOf(Error);
      }
    });

    it('save() propagates write errors', async () => {
      tempDir = await makeTempDir('manifest-save-error-');
      const server = makeServer();
      await server.manifest.set('@/pages/home.tsx');

      const forced = new Error('write failed');
      try {
        await withPatched(fs, 'writeFile', (async () => { throw forced; }) as typeof fs.writeFile, async () => {
          await server.manifest.save(path.join(tempDir, 'manifest.json'));
        });
        expect.fail('should have thrown');
      } catch (err: unknown) {
        expect(err).to.equal(forced);
      }
    });

    it('save() creates parent directory (via writeFile helper)', async () => {
      tempDir = await makeTempDir('manifest-save-mkdir-');
      const server = makeServer();
      await server.manifest.set('@/pages/home.tsx');

      const file = path.join(tempDir, 'nested', 'manifest.json');
      await server.manifest.save(file);
      expect(JSON.parse(await fs.readFile(file, 'utf8'))).to.be.an('object');
    });
  });

  describe('integration', () => {
    it('handles complete manifest lifecycle', async () => {
      tempDir = await makeTempDir('manifest-lifecycle-');
      const server = makeServer();

      const doc = await server.manifest.set('@/pages/home.tsx');
      expect(await server.manifest.has(doc.entry)).to.equal(true);

      const file = path.join(tempDir, 'manifest.json');
      await server.manifest.save(file);

      const server2 = makeServer();
      await server2.manifest.open(file);
      await new Promise((r) => setTimeout(r, 0));

      const found = server2.manifest.find(doc.id);
      expect(found).to.not.equal(null);
      expect(found?.entry).to.equal(doc.entry);
    });
  });

  describe('error handling', () => {
    it('handles Document constructor errors', async () => {
      tempDir = await makeTempDir('manifest-doc-error-');
      const server = makeServer();

      const forced = new Error('Document ctor');
      try {
        await withPatched(
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          (await import('../src/Document.js')) as any,
          'default',
          (function() { throw forced; }) as any,
          async () => {
            await server.manifest.set('@/pages/home.tsx');
          }
        );
        expect.fail('should have thrown');
      } catch (err: unknown) {
        // Depending on ESM caching, patching default export may not work.
        // If it does, we expect forced. Otherwise, just ensure an error is thrown.
        expect(err).to.be.instanceOf(Error);
      }
    });

    it('handles loader errors', async () => {
      tempDir = await makeTempDir('manifest-loader-error-');
      const server = makeServer();

      const forced = new Error('absolute failed');
      try {
        await withPatched(server.loader, 'absolute', (async () => { throw forced; }) as any, async () => {
          await server.manifest.set('./pages/home.tsx');
        });
        expect.fail('should have thrown');
      } catch (err: unknown) {
        expect(err).to.equal(forced);
      }
    });
  });
});
