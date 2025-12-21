//tests
import { describe, it, afterEach } from 'mocha';
import { expect } from 'chai';
//node
import path from 'node:path';
//reactus
import Server from '../src/Server.js';
import Document from '../src/Document.js';
import DocumentBuilder from '../src/DocumentBuilder.js';
import DocumentLoader from '../src/DocumentLoader.js';
import DocumentRender from '../src/DocumentRender.js';
import { id as hashId } from '../src/helpers.js';
import { cleanupTempDir, makeTempDir } from './helpers.js';

describe('Document', () => {
  let tempDir = '';

  afterEach(async () => {
    if (tempDir) await cleanupTempDir(tempDir);
    tempDir = '';
  });

  function makeServer(production = true) {
    const config = Server.configure({
      production,
      cwd: tempDir,
      basePath: '/',
      plugins: []
    });

    return new Server(config);
  }

  describe('constructor', () => {
    it('initializes with entry and server', async () => {
      tempDir = await makeTempDir('doc-ctor-');
      const server = makeServer(true);
      const doc = new Document('@/pages/home.tsx', server);

      expect(doc.entry).to.equal('@/pages/home.tsx');
      expect(doc.server).to.equal(server);
    });

    it('creates builder, loader, and render instances', async () => {
      tempDir = await makeTempDir('doc-ctor2-');
      const server = makeServer(true);
      const doc = new Document('@/pages/home.tsx', server);

      expect(doc.builder).to.be.instanceOf(DocumentBuilder);
      expect(doc.loader).to.be.instanceOf(DocumentLoader);
      expect(doc.render).to.be.instanceOf(DocumentRender);
    });
  });

  describe('id getter', () => {
    it('generates id from entry basename and hash', async () => {
      tempDir = await makeTempDir('doc-id-');
      const server = makeServer(true);
      const entry = '@/pages/home.tsx';
      const doc = new Document(entry, server);

      const expected = `${path.basename(entry)}-${hashId(entry, 8)}`;
      expect(doc.id).to.equal(expected);
    });

    it('handles nested paths correctly', async () => {
      tempDir = await makeTempDir('doc-id-nested-');
      const server = makeServer(true);
      const entry = '@/pages/admin/settings.tsx';
      const doc = new Document(entry, server);

      expect(doc.id).to.equal(`${path.basename(entry)}-${hashId(entry, 8)}`);
    });

    it('handles module paths', async () => {
      tempDir = await makeTempDir('doc-id-module-');
      const server = makeServer(true);
      const entry = 'some-module/pages/home.tsx';
      const doc = new Document(entry, server);

      expect(doc.id).to.equal(`${path.basename(entry)}-${hashId(entry, 8)}`);
    });

    it('handles files without extension', async () => {
      tempDir = await makeTempDir('doc-id-noext-');
      const server = makeServer(true);
      const entry = '@/pages/home';
      const doc = new Document(entry, server);

      expect(doc.id).to.equal(`${path.basename(entry)}-${hashId(entry, 8)}`);
    });
  });

  describe('property access', () => {
    it('provides access to entry property', async () => {
      tempDir = await makeTempDir('doc-props-');
      const server = makeServer(true);
      const doc = new Document('@/pages/home.tsx', server);
      expect(doc.entry).to.equal('@/pages/home.tsx');
    });

    it('provides access to server property', async () => {
      tempDir = await makeTempDir('doc-props2-');
      const server = makeServer(true);
      const doc = new Document('@/pages/home.tsx', server);
      expect(doc.server).to.equal(server);
    });

    it('provides access to builder property', async () => {
      tempDir = await makeTempDir('doc-props3-');
      const server = makeServer(true);
      const doc = new Document('@/pages/home.tsx', server);
      expect(doc.builder).to.be.instanceOf(DocumentBuilder);
    });

    it('provides access to loader property', async () => {
      tempDir = await makeTempDir('doc-props4-');
      const server = makeServer(true);
      const doc = new Document('@/pages/home.tsx', server);
      expect(doc.loader).to.be.instanceOf(DocumentLoader);
    });

    it('provides access to render property', async () => {
      tempDir = await makeTempDir('doc-props5-');
      const server = makeServer(true);
      const doc = new Document('@/pages/home.tsx', server);
      expect(doc.render).to.be.instanceOf(DocumentRender);
    });
  });
});
