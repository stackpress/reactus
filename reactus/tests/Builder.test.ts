//node
import fs from 'node:fs/promises';
import path from 'node:path';
//tests
import { describe, it, afterEach } from 'mocha';
import { expect } from 'chai';
//reactus
import type { BuildResults } from '../src/types.js';
import Server from '../src/Server.js';
import Builder from '../src/Builder.js';
import { cleanupTempDir, makeTempDir, withPatched } from './helpers.js';

describe('Builder', () => {
  let tempDir = '';

  afterEach(async () => {
    if (tempDir) await cleanupTempDir(tempDir);
    tempDir = '';
  });

  function makeBuilder(production = true) {
    const config = Server.configure({
      production,
      cwd: tempDir,
      basePath: '/',
      plugins: []
    });
    return new Builder(config);
  }

  describe('constructor', () => {
    it('creates a Builder instance that extends Server', async () => {
      tempDir = await makeTempDir('builder-ctor-');
      const builder = makeBuilder(true);
      expect(builder).to.be.instanceOf(Server);
    });

    it('initializes expected Server components', async () => {
      tempDir = await makeTempDir('builder-ctor2-');
      const builder = makeBuilder(true);
      expect(builder.loader).to.exist;
      expect(builder.manifest).to.exist;
      expect(builder.resource).to.exist;
      expect(builder.vfs).to.exist;
    });
  });

  describe('buildAssets()', () => {
    it('returns empty array when no documents exist', async () => {
      tempDir = await makeTempDir('builder-assets-empty-');
      const builder = makeBuilder(true);

      const results = await withPatched(builder.manifest, 'values', (() => []) as any, async () => {
        return await builder.buildAssets();
      });

      expect(results).to.deep.equal([]);
    });

    it('processes asset outputs correctly and writes them to disk', async () => {
      tempDir = await makeTempDir('builder-assets-write-');
      const builder = makeBuilder(true);

      const doc = {
        id: 'doc-1',
        entry: '@/pages/home.tsx',
        builder: {
          buildAssets: async (): Promise<BuildResults> => {
            return [
              { type: 'chunk', fileName: 'assets/home.js', code: 'console.log(1)' } as any,
              { type: 'asset', fileName: 'assets/site.css', source: 'body{color:red}' } as any
            ];
          }
        },
        loader: { absolute: async () => path.join(tempDir, 'pages', 'home.tsx') }
      } as any;

      const results = await withPatched(builder.manifest, 'values', (() => [doc]) as any, async () => {
        return await builder.buildAssets();
      });

      expect(results).to.have.length(1);
      expect(results[0].code).to.equal(200);
      expect(results[0].results?.type).to.equal('asset');

      const expectedFile = path.join(builder.paths.asset, 'site.css');
      expect(await fs.readFile(expectedFile, 'utf8')).to.equal('body{color:red}');
    });

    it('handles build failures gracefully when buildAssets returns non-array', async () => {
      tempDir = await makeTempDir('builder-assets-fail-');
      const builder = makeBuilder(true);

      const doc = {
        id: 'doc-1',
        entry: '@/pages/home.tsx',
        builder: { buildAssets: async () => null },
        loader: { absolute: async () => path.join(tempDir, 'pages', 'home.tsx') }
      } as any;

      const results = await withPatched(builder.manifest, 'values', (() => [doc]) as any, async () => {
        return await builder.buildAssets();
      });

      expect(results).to.have.length(1);
      expect(results[0].code).to.equal(500);
    });

    it('skips non-asset outputs', async () => {
      tempDir = await makeTempDir('builder-assets-skip-');
      const builder = makeBuilder(true);

      const doc = {
        id: 'doc-1',
        entry: '@/pages/home.tsx',
        builder: {
          buildAssets: async (): Promise<BuildResults> => {
            return [
              { type: 'chunk', fileName: 'assets/home.js', code: 'console.log(1)' } as any,
              { type: 'chunk', fileName: 'assets/vendor.js', code: 'console.log(2)' } as any
            ];
          }
        },
        loader: { absolute: async () => path.join(tempDir, 'pages', 'home.tsx') }
      } as any;

      const results = await withPatched(builder.manifest, 'values', (() => [doc]) as any, async () => {
        return await builder.buildAssets();
      });

      expect(results).to.deep.equal([]);
    });

    it('rejects assets not in assets/ directory', async () => {
      tempDir = await makeTempDir('builder-assets-reject-');
      const builder = makeBuilder(true);

      const doc = {
        id: 'doc-1',
        entry: '@/pages/home.tsx',
        builder: {
          buildAssets: async (): Promise<BuildResults> => {
            return [
              { type: 'asset', fileName: 'public/site.css', source: 'x' } as any
            ];
          }
        },
        loader: { absolute: async () => path.join(tempDir, 'pages', 'home.tsx') }
      } as any;

      const results = await withPatched(builder.manifest, 'values', (() => [doc]) as any, async () => {
        return await builder.buildAssets();
      });

      expect(results).to.have.length(1);
      expect(results[0].code).to.equal(404);
      expect(results[0].status).to.equal('Not Found');
      expect(results[0].error).to.include("was not saved");
    });
  });

  describe('buildClients()', () => {
    it('returns empty array when no documents exist', async () => {
      tempDir = await makeTempDir('builder-clients-empty-');
      const builder = makeBuilder(true);

      const results = await withPatched(builder.manifest, 'values', (() => []) as any, async () => {
        return await builder.buildClients();
      });

      expect(results).to.deep.equal([]);
    });

    it('processes client chunks correctly (entry + asset chunks)', async () => {
      tempDir = await makeTempDir('builder-clients-write-');
      const builder = makeBuilder(true);

      const doc = {
        id: 'doc-1',
        entry: '@/pages/home.tsx',
        builder: {
          buildClient: async (): Promise<BuildResults> => {
            return [
              { type: 'chunk', fileName: 'entry.js', code: 'console.log(1)' } as any,
              { type: 'chunk', fileName: 'assets/vendor.js', code: 'console.log(2)' } as any
            ];
          }
        },
        loader: { absolute: async () => path.join(tempDir, 'pages', 'home.tsx') }
      } as any;

      const results = await withPatched(builder.manifest, 'values', (() => [doc]) as any, async () => {
        return await builder.buildClients();
      });

      expect(results).to.have.length(1);
      expect(results[0].code).to.equal(200);
      expect(results[0].results?.type).to.equal('client');

      // entry
      const entryFile = path.join(builder.paths.client, 'doc-1.js');
      expect(await fs.readFile(entryFile, 'utf8')).to.equal('console.log(1)');

      // asset
      const assetFile = path.join(builder.paths.client, 'assets/vendor.js');
      expect(await fs.readFile(assetFile, 'utf8')).to.equal('console.log(2)');
    });

    it('handles missing chunk output', async () => {
      tempDir = await makeTempDir('builder-clients-missing-');
      const builder = makeBuilder(true);

      const doc = {
        id: 'doc-1',
        entry: '@/pages/home.tsx',
        builder: { buildClient: async () => [{ type: 'asset', fileName: 'assets/a.css', source: 'x' }] },
        loader: { absolute: async () => path.join(tempDir, 'pages', 'home.tsx') }
      } as any;

      const results = await withPatched(builder.manifest, 'values', (() => [doc]) as any, async () => {
        return await builder.buildClients();
      });

      expect(results).to.have.length(1);
      expect(results[0].code).to.equal(404);
    });
  });

  describe('buildPages()', () => {
    it('returns empty array when no documents exist', async () => {
      tempDir = await makeTempDir('builder-pages-empty-');
      const builder = makeBuilder(true);

      const results = await withPatched(builder.manifest, 'values', (() => []) as any, async () => {
        return await builder.buildPages();
      });

      expect(results).to.deep.equal([]);
    });

    it('processes page chunks correctly', async () => {
      tempDir = await makeTempDir('builder-pages-write-');
      const builder = makeBuilder(true);

      const doc = {
        id: 'doc-1',
        entry: '@/pages/home.tsx',
        builder: {
          buildPage: async (): Promise<BuildResults> => {
            return [
              { type: 'chunk', fileName: 'page.js', code: 'export default 1' } as any
            ];
          }
        },
        loader: { absolute: async () => path.join(tempDir, 'pages', 'home.tsx') }
      } as any;

      const results = await withPatched(builder.manifest, 'values', (() => [doc]) as any, async () => {
        return await builder.buildPages();
      });

      expect(results).to.have.length(1);
      expect(results[0].code).to.equal(200);

      const file = path.join(builder.paths.page, 'doc-1.js');
      expect(await fs.readFile(file, 'utf8')).to.equal('export default 1');
    });
  });
});
