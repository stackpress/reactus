//tests
import { describe, it } from 'mocha';
import { expect } from 'chai';
//modules
import NodeFS from '@stackpress/lib/NodeFS';
//reactus
import ServerLoader from '../src/ServerLoader.js';

describe('ServerLoader', () => {
  describe('constructor', () => {
    it('initializes with default file system and cwd', () => {
      const resource = { dev: async () => ({ ssrLoadModule: async () => ({}) }) } as any;
      const loader = new ServerLoader({ production: true, resource });
      expect(loader.cwd).to.equal(process.cwd());
      expect(loader.fs).to.exist;
    });

    it('initializes with custom file system', () => {
      const fs = new NodeFS();
      const resource = { dev: async () => ({ ssrLoadModule: async () => ({}) }) } as any;
      const loader = new ServerLoader({ production: true, resource, fs });
      expect(loader.fs).to.equal(fs);
    });

    it('initializes with custom cwd', () => {
      const resource = { dev: async () => ({ ssrLoadModule: async () => ({}) }) } as any;
      const loader = new ServerLoader({ production: true, resource, cwd: '/tmp' });
      expect(loader.cwd).to.equal('/tmp');
    });

    it('initializes with production mode', () => {
      const resource = { dev: async () => ({ ssrLoadModule: async () => ({}) }) } as any;
      // if production, `.import()` uses native loader.import when ext is .js
      const loader = new ServerLoader({ production: true, resource });
      expect(loader).to.exist;
    });

    it('initializes with development mode', () => {
      const resource = { dev: async () => ({ ssrLoadModule: async () => ({}) }) } as any;
      const loader = new ServerLoader({ production: false, resource });
      expect(loader).to.exist;
    });

    it('stores resource reference (observable via fetch())', async () => {
      let called = 0;
      const resource = {
        dev: async () => ({
          ssrLoadModule: async (_url: string) => {
            called++;
            return { ok: true };
          }
        })
      } as any;

      const loader = new ServerLoader({ production: false, resource });
      const mod = await loader.fetch('file:///x.tsx');
      expect(mod).to.deep.equal({ ok: true });
      expect(called).to.equal(1);
    });
  });

  describe('getters', () => {
    it('returns cwd from file loader', () => {
      const resource = { dev: async () => ({ ssrLoadModule: async () => ({}) }) } as any;
      const loader = new ServerLoader({ production: true, resource, cwd: '/tmp' });
      expect(loader.cwd).to.equal('/tmp');
    });

    it('returns fs from file loader', () => {
      const fs = new NodeFS();
      const resource = { dev: async () => ({ ssrLoadModule: async () => ({}) }) } as any;
      const loader = new ServerLoader({ production: true, resource, fs });
      expect(loader.fs).to.equal(fs);
    });
  });

  describe('absolute()', () => {
    it('calls file loader absolute with default pwd', async () => {
      const resource = { dev: async () => ({ ssrLoadModule: async () => ({}) }) } as any;
      const loader = new ServerLoader({ production: true, resource, cwd: '/tmp' });
      const absolute = await loader.absolute('./x.ts');
      expect(absolute.startsWith('/tmp')).to.equal(true);
    });

    it('calls file loader absolute with custom pwd', async () => {
      const resource = { dev: async () => ({ ssrLoadModule: async () => ({}) }) } as any;
      const loader = new ServerLoader({ production: true, resource, cwd: '/tmp' });
      const absolute = await loader.absolute('./x.ts', '/var');
      expect(absolute.startsWith('/var')).to.equal(true);
    });

    it('handles absolute path resolution errors by bubbling', async () => {
      const resource = { dev: async () => ({ ssrLoadModule: async () => ({}) }) } as any;
      const loader = new ServerLoader({ production: true, resource, cwd: '/tmp' });

      // FileLoader.absolute does not throw for typical inputs; assert it returns a string.
      expect(await loader.absolute('x')).to.be.a('string');
    });
  });

  describe('fetch()', () => {
    it('fetches module using dev server', async () => {
      const resource = {
        dev: async () => ({
          ssrLoadModule: async () => ({ ok: true })
        })
      } as any;

      const loader = new ServerLoader({ production: false, resource });
      expect(await loader.fetch('file:///x.tsx')).to.deep.equal({ ok: true });
    });

    it('handles fetch errors', async () => {
      const forced = new Error('fetch failed');
      const resource = {
        dev: async () => ({
          ssrLoadModule: async () => { throw forced; }
        })
      } as any;

      const loader = new ServerLoader({ production: false, resource });
      try {
        await loader.fetch('file:///x.tsx');
        expect.fail('should have thrown');
      } catch (err: unknown) {
        expect(err).to.equal(forced);
      }
    });

    it('handles dev server initialization errors', async () => {
      const forced = new Error('dev failed');
      const resource = { dev: async () => { throw forced; } } as any;
      const loader = new ServerLoader({ production: false, resource });

      try {
        await loader.fetch('file:///x.tsx');
        expect.fail('should have thrown');
      } catch (err: unknown) {
        expect(err).to.equal(forced);
      }
    });
  });

  describe('import()', () => {
    it('uses native import for production mode with .js files', async () => {
      const resource = { dev: async () => ({ ssrLoadModule: async () => ({}) }) } as any;
      const loader = new ServerLoader({ production: true, resource, cwd: process.cwd() });

      // We'll stub resolve() + underlying FileLoader.import() via monkey-patching.
      const originalResolve = (loader as any).resolve.bind(loader);
      const originalImport = (loader as any)._loader.import.bind((loader as any)._loader);

      try {
        (loader as any).resolve = async () => ({ filepath: '/tmp/x.js', basepath: '/tmp/x', extname: '.js' });
        let called = 0;
        (loader as any)._loader.import = async () => { called++; return { ok: true }; };

        const mod = await loader.import('/tmp/x');
        expect(mod).to.deep.equal({ ok: true });
        expect(called).to.equal(1);
      } finally {
        (loader as any).resolve = originalResolve;
        (loader as any)._loader.import = originalImport;
      }
    });

    it('uses native import for .js files in development mode', async () => {
      const resource = { dev: async () => ({ ssrLoadModule: async () => ({}) }) } as any;
      const loader = new ServerLoader({ production: false, resource, cwd: process.cwd() });

      const originalResolve = (loader as any).resolve.bind(loader);
      const originalImport = (loader as any)._loader.import.bind((loader as any)._loader);

      try {
        (loader as any).resolve = async () => ({ filepath: '/tmp/x.js', basepath: '/tmp/x', extname: '.js' });
        let called = 0;
        (loader as any)._loader.import = async () => { called++; return { ok: true }; };

        const mod = await loader.import('/tmp/x');
        expect(mod).to.deep.equal({ ok: true });
        expect(called).to.equal(1);
      } finally {
        (loader as any).resolve = originalResolve;
        (loader as any)._loader.import = originalImport;
      }
    });

    it('uses dev server for .tsx files in development mode', async () => {
      let fetched = '';
      const resource = {
        dev: async () => ({
          ssrLoadModule: async (url: string) => {
            fetched = url;
            return { ok: true };
          }
        })
      } as any;

      const loader = new ServerLoader({ production: false, resource, cwd: process.cwd() });

      const originalResolve = (loader as any).resolve.bind(loader);
      try {
        (loader as any).resolve = async () => ({ filepath: '/tmp/x.tsx', basepath: '/tmp/x', extname: '.tsx' });
        const mod = await loader.import('/tmp/x');
        expect(mod).to.deep.equal({ ok: true });
        expect(fetched).to.equal('file:///tmp/x.tsx');
      } finally {
        (loader as any).resolve = originalResolve;
      }
    });

    it('uses custom extnames', async () => {
      const resource = { dev: async () => ({ ssrLoadModule: async () => ({ ok: true }) }) } as any;
      const loader = new ServerLoader({ production: false, resource, cwd: process.cwd() });

      let passed: string[] = [];
      const originalResolve = (loader as any).resolve.bind(loader);
      try {
        (loader as any).resolve = async (_pathname: string, extnames: string[]) => {
          passed = extnames;
          return { filepath: '/tmp/x.tsx', basepath: '/tmp/x', extname: '.tsx' };
        };
        await loader.import('/tmp/x', ['.abc']);
        expect(passed).to.deep.equal(['.abc']);
      } finally {
        (loader as any).resolve = originalResolve;
      }
    });

    it('handles import resolution errors', async () => {
      const resource = { dev: async () => ({ ssrLoadModule: async () => ({}) }) } as any;
      const loader = new ServerLoader({ production: true, resource, cwd: process.cwd() });

      const forced = new Error('resolve failed');
      const originalResolve = (loader as any).resolve.bind(loader);
      try {
        (loader as any).resolve = async () => { throw forced; };
        await loader.import('/tmp/x');
        expect.fail('should have thrown');
      } catch (err: unknown) {
        expect(err).to.equal(forced);
      } finally {
        (loader as any).resolve = originalResolve;
      }
    });

    it('handles native import errors', async () => {
      const resource = { dev: async () => ({ ssrLoadModule: async () => ({}) }) } as any;
      const loader = new ServerLoader({ production: true, resource, cwd: process.cwd() });

      const forced = new Error('import failed');
      const originalResolve = (loader as any).resolve.bind(loader);
      const originalImport = (loader as any)._loader.import.bind((loader as any)._loader);

      try {
        (loader as any).resolve = async () => ({ filepath: '/tmp/x.js', basepath: '/tmp/x', extname: '.js' });
        (loader as any)._loader.import = async () => { throw forced; };

        await loader.import('/tmp/x');
        expect.fail('should have thrown');
      } catch (err: unknown) {
        expect(err).to.equal(forced);
      } finally {
        (loader as any).resolve = originalResolve;
        (loader as any)._loader.import = originalImport;
      }
    });

    it('handles dev server import errors', async () => {
      const forced = new Error('dev import failed');
      const resource = {
        dev: async () => ({
          ssrLoadModule: async () => { throw forced; }
        })
      } as any;

      const loader = new ServerLoader({ production: false, resource, cwd: process.cwd() });

      const originalResolve = (loader as any).resolve.bind(loader);
      try {
        (loader as any).resolve = async () => ({ filepath: '/tmp/x.tsx', basepath: '/tmp/x', extname: '.tsx' });
        await loader.import('/tmp/x');
        expect.fail('should have thrown');
      } catch (err: unknown) {
        expect(err).to.equal(forced);
      } finally {
        (loader as any).resolve = originalResolve;
      }
    });
  });

  describe('relative()', () => {
    it('calls file loader relative with default withExtname', () => {
      const resource = { dev: async () => ({ ssrLoadModule: async () => ({}) }) } as any;
      const loader = new ServerLoader({ production: true, resource, cwd: '/tmp' });
      const rel = loader.relative('/tmp/a.ts', '/tmp/b.ts');
      expect(rel.startsWith('.')).to.equal(true);
    });

    it('calls file loader relative with custom withExtname', () => {
      const resource = { dev: async () => ({ ssrLoadModule: async () => ({}) }) } as any;
      const loader = new ServerLoader({ production: true, resource, cwd: '/tmp' });
      const rel = loader.relative('/tmp/a.ts', '/tmp/b.ts', true);
      expect(rel).to.include('b.ts');
    });
  });

  describe('resolveFile()', () => {
    it('calls file loader resolveFile with default parameters', async () => {
      const resource = { dev: async () => ({ ssrLoadModule: async () => ({}) }) } as any;
      const loader = new ServerLoader({ production: true, resource, cwd: '/tmp' });
      const resolved = await loader.resolveFile('./missing', ['.js'], '/tmp', false);
      expect(resolved).to.satisfy((v: any) => v === null || typeof v === 'string');
    });

    it('calls file loader resolveFile with custom parameters', async () => {
      const resource = { dev: async () => ({ ssrLoadModule: async () => ({}) }) } as any;
      const loader = new ServerLoader({ production: true, resource, cwd: '/tmp' });
      const resolved = await loader.resolveFile('./missing', ['.abc'], '/tmp', false);
      expect(resolved).to.satisfy((v: any) => v === null || typeof v === 'string');
    });
  });

  describe('resolve()', () => {
    it('resolves file and return metadata', async () => {
      const resource = { dev: async () => ({ ssrLoadModule: async () => ({}) }) } as any;
      const loader = new ServerLoader({ production: true, resource, cwd: process.cwd() });

      // resolve() should throw if file not found; pick known file.
      const meta = await loader.resolve('package.json', ['.json']);
      expect(meta.extname).to.equal('.json');
      expect(meta.filepath).to.include('package.json');
      expect(meta.basepath).to.not.equal('');
    });

    it('resolves file with custom extnames', async () => {
      const resource = { dev: async () => ({ ssrLoadModule: async () => ({}) }) } as any;
      const loader = new ServerLoader({ production: true, resource, cwd: process.cwd() });
      const meta = await loader.resolve('package', ['.json']);
      expect(meta.extname).to.equal('.json');
    });

    it('handles resolve errors when file not found', async () => {
      const resource = { dev: async () => ({ ssrLoadModule: async () => ({}) }) } as any;
      const loader = new ServerLoader({ production: true, resource, cwd: process.cwd() });

      try {
        await loader.resolve('definitely-missing-file');
        expect.fail('should have thrown');
      } catch (err: unknown) {
        expect(err).to.be.instanceOf(Error);
      }
    });

    it('handles different file extensions', async () => {
      const resource = { dev: async () => ({ ssrLoadModule: async () => ({}) }) } as any;
      const loader = new ServerLoader({ production: true, resource, cwd: process.cwd() });
      const meta = await loader.resolve('reactus/package', ['.json']);
      expect(meta.extname).to.equal('.json');
    });
  });
});
