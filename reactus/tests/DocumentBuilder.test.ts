//tests
import { describe, it, afterEach } from 'mocha';
import { expect } from 'chai';
//node
import fs from 'node:fs/promises';
import path from 'node:path';
//reactus
import DocumentBuilder from '../src/DocumentBuilder.js';
import Server from '../src/Server.js';
import { cleanupTempDir, makeTempDir } from './helpers.js';

// This test suite focuses on public behavior (buildAssets/buildClient/buildPage)
// and treats VFS writes / Vite build invocation as observable side effects.

describe('DocumentBuilder', () => {
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

  function makeDocument(server: Server, entry = '@/pages/home.tsx') {
    const document = {
      entry,
      id: 'home-123',
      server,
      loader: {
        absolute: async () => path.join(tempDir, 'pages', 'home.tsx'),
        relative: async (_fromFile: string) => './pages/home.tsx'
      }
    } as any;

    return document;
  }

  describe('constructor', () => {
    it('initializes with document and server references', async () => {
      tempDir = await makeTempDir('docbuilder-ctor-');
      const server = makeServer();
      const document = makeDocument(server);

      const builder = new DocumentBuilder(document);
      expect(builder).to.be.instanceOf(DocumentBuilder);
    });
  });

  describe('buildAssets()', () => {
    it('builds assets using VFS input url and server resource', async () => {
      tempDir = await makeTempDir('docbuilder-assets-');
      const server = makeServer();
      const document = makeDocument(server);
      const builder = new DocumentBuilder(document);

      // Capture VFS writes.
      const vfsCalls: Array<{ file: string; code: string }> = [];
      (server.vfs as any).set = (file: string, code: string) => {
        vfsCalls.push({ file, code });
        return `virtual:reactus:${file}`;
      };

      // Stub vite build to avoid running real Vite.
      let buildInput = '';
      (server.resource as any).build = async (config: any) => {
        buildInput = config.build.rollupOptions.input;
        return { output: [{ type: 'asset', fileName: 'assets/app.css', source: 'body{}' }] };
      };

      const output = await builder.buildAssets();
      expect(Array.isArray(output)).to.equal(true);
      expect(output[0].type).to.equal('asset');

      expect(vfsCalls).to.have.length(1);
      expect(vfsCalls[0].file).to.match(/\.assets\.tsx$/);
      expect(vfsCalls[0].code).to.include("export const styles = []");
      expect(buildInput).to.equal(`virtual:reactus:${vfsCalls[0].file}`);
    });
  });

  describe('buildClient()', () => {
    it('builds client entry using client template and VFS', async () => {
      tempDir = await makeTempDir('docbuilder-client-');
      const server = makeServer();
      const document = makeDocument(server);
      const builder = new DocumentBuilder(document);

      let vfsFile = '';
      let vfsCode = '';
      (server.vfs as any).set = (file: string, code: string) => {
        vfsFile = file;
        vfsCode = code;
        return `virtual:reactus:${file}`;
      };

      let called = 0;
      (server.resource as any).build = async (_config: any) => {
        called++;
        return { output: [{ type: 'chunk', fileName: 'client.js', code: '/*client*/' }] };
      };

      const output = await builder.buildClient();
      expect(called).to.equal(1);
      expect(output[0].type).to.equal('chunk');
      expect(vfsFile).to.match(/\.client\.tsx$/);
      expect(vfsCode).to.include("hydrateRoot");
      expect(vfsCode).to.include('./pages/home.tsx');
    });
  });

  describe('buildPage()', () => {
    it('builds page and injects style file names from assets', async () => {
      tempDir = await makeTempDir('docbuilder-page-');
      const server = makeServer();
      const document = makeDocument(server);
      const builder = new DocumentBuilder(document);

      let vfsCode = '';
      (server.vfs as any).set = (_file: string, code: string) => {
        vfsCode = code;
        return 'virtual:reactus:/page.tsx';
      };

      (server.resource as any).build = async (_config: any) => {
        return { output: [{ type: 'chunk', fileName: 'page.js', code: '/*page*/' }] };
      };

      const assets = [
        { type: 'asset', fileName: 'assets/a.css', source: 'a' },
        { type: 'asset', fileName: 'assets/b.txt', source: 'b' },
        { type: 'asset', fileName: 'assets/c.css', source: 'c' }
      ] as any;

      await builder.buildPage(assets);
      expect(vfsCode).to.include('export const styles = ["a.css","c.css"]');
    });

    it('builds assets first if not provided', async () => {
      tempDir = await makeTempDir('docbuilder-page-assetsfirst-');
      const server = makeServer();
      const document = makeDocument(server);
      const builder = new DocumentBuilder(document);

      let buildAssetsCalled = 0;
      (builder as any).buildAssets = async () => {
        buildAssetsCalled++;
        return [{ type: 'asset', fileName: 'assets/a.css', source: 'a' }] as any;
      };

      (server.vfs as any).set = () => 'virtual:reactus:/page.tsx';
      (server.resource as any).build = async () => ({ output: [{ type: 'chunk', fileName: 'page.js', code: '/*page*/' }] });

      await builder.buildPage();
      expect(buildAssetsCalled).to.equal(1);
    });
  });

  describe('build option methods', () => {
    it('generates correct build options shape for assets/client/page', async () => {
      tempDir = await makeTempDir('docbuilder-options-');
      const server = makeServer();
      const document = makeDocument(server);
      const builder = new DocumentBuilder(document);

      const assetConfig = await (builder as any)._getAssetBuildOptions('virtual:reactus:/a.tsx');
      expect(assetConfig.configFile).to.equal(false);
      expect(assetConfig.build.write).to.equal(false);

      const clientConfig = await (builder as any)._getClientBuildOptions('virtual:reactus:/c.tsx');
      expect(clientConfig.configFile).to.equal(false);
      expect(clientConfig.build.write).to.equal(false);

      const pageConfig = await (builder as any)._getPageBuildOptions('virtual:reactus:/p.tsx');
      expect(pageConfig.configFile).to.equal(false);
      expect(pageConfig.build.rollupOptions.external).to.include('react');
    });
  });
});
