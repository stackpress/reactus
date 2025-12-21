//tests
import { describe, it } from 'mocha';
import { expect } from 'chai';
//reactus
import VirtualServer from '../src/VirtualServer.js';
import { VFS_PROTOCOL } from '../src/constants.js';

describe('VirtualServer', () => {
  describe('constructor', () => {
    it('initializes with empty virtual file system', () => {
      const vfs = new VirtualServer();
      expect(vfs.has('/missing.txt')).to.equal(false);
      expect(vfs.get('/missing.txt')).to.equal(null);
    });

    it('creates a callable map for fs property', () => {
      const vfs = new VirtualServer();

      // `@stackpress/lib/map` returns a callable function with map-like methods.
      expect(typeof vfs.fs).to.equal('function');
      expect(typeof (vfs.fs as any).get).to.equal('function');
      expect(typeof (vfs.fs as any).set).to.equal('function');
    });
  });

  describe('set()', () => {
    it('encodes and stores file contents in VFS', () => {
      const vfs = new VirtualServer();
      vfs.set('/a.txt', 'hello');
      expect(vfs.has('/a.txt')).to.equal(true);
    });

    it('returns VFS protocol URL for stored file', () => {
      const vfs = new VirtualServer();
      const url = vfs.set('/a.txt', 'hello');
      expect(url).to.equal(`${VFS_PROTOCOL}/a.txt`);
    });

    it('encodes contents as base64 (observable via internal map storage shape)', () => {
      const vfs = new VirtualServer();
      vfs.set('/a.txt', 'hello');
      const raw = (vfs.fs as any).get('/a.txt');
      expect(raw).to.equal(Buffer.from('hello').toString('base64'));
    });

    it('handles empty string contents', () => {
      const vfs = new VirtualServer();
      vfs.set('/empty.txt', '');
      expect(vfs.get('/empty.txt')).to.equal('');
    });

    it('handles special characters in contents', () => {
      const vfs = new VirtualServer();
      const contents = 'ñ-ö-漢字-😀';
      vfs.set('/unicode.txt', contents);
      expect(vfs.get('/unicode.txt')).to.equal(contents);
    });

    it('overwrites existing files', () => {
      const vfs = new VirtualServer();
      vfs.set('/a.txt', 'one');
      vfs.set('/a.txt', 'two');
      expect(vfs.get('/a.txt')).to.equal('two');
    });
  });

  describe('get()', () => {
    it('returns decoded file contents from VFS', () => {
      const vfs = new VirtualServer();
      vfs.set('/a.txt', 'hello');
      expect(vfs.get('/a.txt')).to.equal('hello');
    });

    it('returns null for non-existent files', () => {
      const vfs = new VirtualServer();
      expect(vfs.get('/missing.txt')).to.equal(null);
    });

    it('handles complex file contents', () => {
      const vfs = new VirtualServer();
      const contents = 'line1\nline2\nline3';
      vfs.set('/multi.txt', contents);
      expect(vfs.get('/multi.txt')).to.equal(contents);
    });

    it('handles JSON content', () => {
      const vfs = new VirtualServer();
      const json = JSON.stringify({ ok: true, n: 1, text: 'hello' });
      vfs.set('/data.json', json);
      expect(JSON.parse(vfs.get('/data.json') as string)).to.deep.equal({ ok: true, n: 1, text: 'hello' });
    });

    it('returns null when stored value is not a string', () => {
      const vfs = new VirtualServer();
      (vfs.fs as any).set('/bad.txt', 123);
      expect(vfs.get('/bad.txt')).to.equal(null);
    });
  });

  describe('has()', () => {
    it('returns true for existing files', () => {
      const vfs = new VirtualServer();
      vfs.set('/a.txt', 'hello');
      expect(vfs.has('/a.txt')).to.equal(true);
    });

    it('returns false for non-existent files', () => {
      const vfs = new VirtualServer();
      expect(vfs.has('/missing.txt')).to.equal(false);
    });

    it('returns true immediately after setting a file', () => {
      const vfs = new VirtualServer();
      vfs.set('/immediate.txt', 'x');
      expect(vfs.has('/immediate.txt')).to.equal(true);
    });

    it('handles empty file paths', () => {
      const vfs = new VirtualServer();
      expect(vfs.has('')).to.equal(false);
      expect(vfs.get('')).to.equal(null);
    });

    it('is case sensitive', () => {
      const vfs = new VirtualServer();
      vfs.set('/File.txt', 'x');
      expect(vfs.has('/file.txt')).to.equal(false);
      expect(vfs.has('/File.txt')).to.equal(true);
    });
  });

  describe('integration scenarios', () => {
    it('handles multiple files in VFS', () => {
      const vfs = new VirtualServer();
      vfs.set('/a.txt', 'A');
      vfs.set('/b.txt', 'B');
      expect(vfs.get('/a.txt')).to.equal('A');
      expect(vfs.get('/b.txt')).to.equal('B');
    });

    it('maintains file isolation', () => {
      const vfs = new VirtualServer();
      vfs.set('/a.txt', 'A');
      vfs.set('/b.txt', 'B');
      vfs.set('/a.txt', 'AA');
      expect(vfs.get('/a.txt')).to.equal('AA');
      expect(vfs.get('/b.txt')).to.equal('B');
    });

    it('handles nested directory structures', () => {
      const vfs = new VirtualServer();
      vfs.set('/a/b/c.txt', 'nested');
      expect(vfs.get('/a/b/c.txt')).to.equal('nested');
    });

    it('preserves content encoding/decoding integrity', () => {
      const vfs = new VirtualServer();
      const original = 'x'.repeat(10_000);
      vfs.set('/big.txt', original);
      expect(vfs.get('/big.txt')).to.equal(original);
    });
  });
});
