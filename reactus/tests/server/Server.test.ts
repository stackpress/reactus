//node
import fs from 'node:fs/promises';
import path from 'node:path';
//tests
import { describe, it, afterEach } from 'mocha';
import { expect } from 'chai';
//modules
import FileLoader from '@stackpress/lib/FileLoader';
import NodeFS from '@stackpress/lib/NodeFS';
//server
import Server from '../../src/server/Server.js';
import { configure } from '../../src/server/helpers.js';
import { cleanupTempDir, makeTempDir } from '../helpers.js';

describe('server/Server', () => {
  let tempDir = '';

  afterEach(async () => {
    if (tempDir) await cleanupTempDir(tempDir);
    tempDir = '';
  });

  describe('constructor and getters', () => {
    it('initializes FileLoader and default paths, routes, and templates', async () => {
      tempDir = await makeTempDir('legacy-server-ctor-');
      const server = new Server(configure({ cwd: tempDir }));

      expect(server.loader).to.be.instanceOf(FileLoader);
      expect(server.cwd).to.equal(tempDir);
      expect(server.paths.page).to.equal(path.join(tempDir, '.reactus/page'));
      expect(server.routes.client).to.equal('/client');
      expect(server.routes.css).to.equal('/assets');
      expect(server.templates.document).to.be.a('string');
    });

    it('uses custom configuration values and file system', () => {
      const fs = new NodeFS();
      const server = new Server(configure({
        cwd: '/tmp/project',
        clientRoute: '/scripts',
        cssRoute: '/styles',
        pagePath: '/tmp/page',
        documentTemplate: '<html/>',
        fs
      }));

      expect(server.fs).to.equal(fs);
      expect(server.routes.client).to.equal('/scripts');
      expect(server.routes.css).to.equal('/styles');
      expect(server.paths.page).to.equal('/tmp/page');
      expect(server.templates.document).to.equal('<html/>');
    });
  });

  describe('resolve()', () => {
    it('resolves a file and returns metadata with default extensions', async () => {
      tempDir = await makeTempDir('legacy-server-resolve-');
      const pageDir = path.join(tempDir, '.reactus/page');
      await fs.mkdir(pageDir, { recursive: true });
      await fs.writeFile(path.join(pageDir, 'home.js'), 'export default "ok";');

      const server = new Server(configure({ cwd: tempDir }));
      const meta = await server.resolve(path.join(pageDir, 'home'));

      expect(meta.filepath).to.equal(path.join(pageDir, 'home.js'));
      expect(meta.basepath).to.equal(path.join(pageDir, 'home'));
      expect(meta.extname).to.equal('.js');
    });

    it('uses custom extensions and throws when a file cannot be resolved', async () => {
      tempDir = await makeTempDir('legacy-server-resolve-custom-');
      const pageDir = path.join(tempDir, '.reactus/page');
      await fs.mkdir(pageDir, { recursive: true });
      await fs.writeFile(path.join(pageDir, 'home.mjs'), 'export default "ok";');

      const server = new Server(configure({ cwd: tempDir }));
      const meta = await server.resolve(path.join(pageDir, 'home'), ['.mjs']);
      expect(meta.extname).to.equal('.mjs');

      try {
        await server.resolve(path.join(pageDir, 'missing'));
        expect.fail('should have thrown');
      } catch (error: unknown) {
        expect(error).to.be.instanceOf(Error);
      }
    });
  });

  describe('import()', () => {
    it('imports a resolved page module with default and custom extensions', async () => {
      tempDir = await makeTempDir('legacy-server-import-');
      const pageDir = path.join(tempDir, '.reactus/page');
      await fs.mkdir(pageDir, { recursive: true });
      await fs.writeFile(path.join(pageDir, 'home.js'), 'export default { value: "home" };');
      await fs.writeFile(path.join(pageDir, 'custom.mjs'), 'export default { value: "custom" };');

      const server = new Server(configure({ cwd: tempDir }));
      const home = await server.import<{ default: { value: string } }>(path.join(pageDir, 'home'));
      const custom = await server.import<{ default: { value: string } }>(path.join(pageDir, 'custom'), ['.mjs']);

      expect(home.default).to.deep.equal({ value: 'home' });
      expect(custom.default).to.deep.equal({ value: 'custom' });
    });
  });
});
