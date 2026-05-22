//tests
import { describe, it, afterEach } from 'mocha';
import { expect } from 'chai';
//reactus
import engine, {
  dev,
  build,
  serve,
  Server,
  Builder
} from '../src/index.js';
import { cleanupTempDir, makeTempDir } from './helpers.js';

describe('index entrypoint', () => {
  let tempDir = '';

  afterEach(async () => {
    if (tempDir) await cleanupTempDir(tempDir);
    tempDir = '';
  });

  it('dev() exposes a development server wrapper and delegates document helpers', async () => {
    tempDir = await makeTempDir('index-dev-');
    const app = dev({ cwd: tempDir, plugins: [] });
    const document = {
      id: 'doc-id',
      loader: {
        absolute: async () => '/abs/page.tsx',
        import: async () => ({ default: 'page-module' })
      },
      render: {
        renderHMRClient: async () => 'hmr-client',
        renderMarkup: async (props: Record<string, unknown>) => `html:${props.message}`
      }
    };

    Object.defineProperty(app.server.manifest, 'size', { configurable: true, get: () => 2 });
    (app.server.manifest as any).set = async () => document;
    (app.server.manifest as any).entries = () => [['@/pages/home.tsx', document]];
    (app.server.manifest as any).find = (id: string) => id === 'doc-id' ? document : null;
    (app.server.manifest as any).forEach = (callback: (value: unknown) => void) => callback(document);
    (app.server.manifest as any).get = (entry: string) => entry === '@/pages/home.tsx' ? document : null;
    (app.server.manifest as any).has = () => true;
    (app.server.manifest as any).load = (hash: Record<string, string>) => hash;
    (app.server.manifest as any).open = async (file: string) => ({ file });
    (app.server.manifest as any).map = (callback: (value: unknown) => unknown) => [callback(document)];
    (app.server.manifest as any).save = async (file: string) => file;
    (app.server.manifest as any).toJSON = () => ({ '@/pages/home.tsx': 'doc-id' });
    (app.server.manifest as any).values = () => [document];
    (app.server.resource as any).dev = async () => 'dev-server';
    (app.server.resource as any).middlewares = async () => 'middlewares';
    (app.server.resource as any).plugins = async () => ['plugin'];
    (app.server as any).http = async () => 'http-result';

    expect(app.server).to.be.instanceOf(Server);
    expect(app.config.production).to.equal(false);
    expect(app.size).to.equal(2);
    expect(await app.dev()).to.equal('dev-server');
    expect(await app.http({} as any, {} as any)).to.equal('http-result');
    expect(await app.middlewares()).to.equal('middlewares');
    expect(await app.plugins()).to.deep.equal(['plugin']);
    expect(app.entries()).to.deep.equal([['@/pages/home.tsx', document]]);
    expect(app.find('doc-id')).to.equal(document);
    expect(app.get('@/pages/home.tsx')).to.equal(document);
    expect(app.has('@/pages/home.tsx')).to.equal(true);
    expect(app.load({ a: 'b' })).to.deep.equal({ a: 'b' });
    expect(await app.open('manifest.json')).to.deep.equal({ file: 'manifest.json' });
    expect(app.map((value) => value)).to.deep.equal([document]);
    expect(await app.save('manifest.json')).to.equal('manifest.json');
    expect(await app.set('@/pages/home.tsx')).to.equal(document);
    expect(app.toJSON()).to.deep.equal({ '@/pages/home.tsx': 'doc-id' });
    expect(await app.absolute('@/pages/home.tsx')).to.equal('/abs/page.tsx');
    expect(await app.id('@/pages/home.tsx')).to.equal('doc-id');
    expect(await app.importPage('@/pages/home.tsx')).to.deep.equal({ default: 'page-module' });
    expect(await app.renderHMR('@/pages/home.tsx')).to.equal('hmr-client');
    expect(await app.render('@/pages/home.tsx', { message: 'hello' })).to.equal('html:hello');
    expect(app.values()).to.deep.equal([document]);
  });

  it('build() exposes a builder wrapper and delegates build methods', async () => {
    tempDir = await makeTempDir('index-build-');
    const app = build({ cwd: tempDir, plugins: [] });
    const document = {
      id: 'doc-id',
      builder: {
        buildAssets: async () => ['asset-output'],
        buildClient: async () => ['client-output'],
        buildPage: async (assets?: unknown[]) => assets ?? ['page-output']
      },
      loader: {
        absolute: async () => '/abs/page.tsx'
      }
    };

    Object.defineProperty(app.builder.manifest, 'size', { configurable: true, get: () => 1 });
    (app.builder.manifest as any).set = async () => document;
    (app.builder.manifest as any).entries = () => [['@/pages/home.tsx', document]];
    (app.builder.manifest as any).find = (id: string) => id === 'doc-id' ? document : null;
    (app.builder.manifest as any).forEach = (callback: (value: unknown) => void) => callback(document);
    (app.builder.manifest as any).get = (entry: string) => entry === '@/pages/home.tsx' ? document : null;
    (app.builder.manifest as any).has = () => true;
    (app.builder.manifest as any).load = (hash: Record<string, string>) => hash;
    (app.builder.manifest as any).open = async (file: string) => ({ file });
    (app.builder.manifest as any).map = (callback: (value: unknown) => unknown) => [callback(document)];
    (app.builder.manifest as any).save = async (file: string) => file;
    (app.builder.manifest as any).toJSON = () => ({ '@/pages/home.tsx': 'doc-id' });
    (app.builder.manifest as any).values = () => [document];
    (app.builder as any).buildAssets = async () => ['all-assets'];
    (app.builder as any).buildClients = async () => ['all-clients'];
    (app.builder as any).buildPages = async () => ['all-pages'];
    (app.builder.resource as any).build = async (config: unknown) => config;
    (app.builder.resource as any).plugins = async () => ['plugin'];

    expect(app.builder).to.be.instanceOf(Builder);
    expect(app.production).to.equal(false);
    expect(app.size).to.equal(1);
    expect(await app.build({ build: { write: false } } as any)).to.deep.equal({ build: { write: false } });
    expect(await app.plugins()).to.deep.equal(['plugin']);
    expect(await app.buildAllAssets()).to.deep.equal(['all-assets']);
    expect(await app.buildAllClients()).to.deep.equal(['all-clients']);
    expect(await app.buildAllPages()).to.deep.equal(['all-pages']);
    expect(app.entries()).to.deep.equal([['@/pages/home.tsx', document]]);
    expect(app.find('doc-id')).to.equal(document);
    app.forEach(() => {});
    expect(app.get('@/pages/home.tsx')).to.equal(document);
    expect(app.has('@/pages/home.tsx')).to.equal(true);
    expect(app.load({ a: 'b' })).to.deep.equal({ a: 'b' });
    expect(await app.open('manifest.json')).to.deep.equal({ file: 'manifest.json' });
    expect(app.map((value) => value)).to.deep.equal([document]);
    expect(await app.save('manifest.json')).to.equal('manifest.json');
    expect(await app.set('@/pages/home.tsx')).to.equal(document);
    expect(app.toJSON()).to.deep.equal({ '@/pages/home.tsx': 'doc-id' });
    expect(app.values()).to.deep.equal([document]);
    expect(await app.absolute('@/pages/home.tsx')).to.equal('/abs/page.tsx');
    expect(await app.id('@/pages/home.tsx')).to.equal('doc-id');
    expect(await app.buildAssets('@/pages/home.tsx')).to.deep.equal(['asset-output']);
    expect(await app.buildClient('@/pages/home.tsx')).to.deep.equal(['client-output']);
    expect(await app.buildPage('@/pages/home.tsx', ['styles'] as any)).to.deep.equal(['styles']);
  });

  it('serve() exposes a production server wrapper and delegates rendering methods', async () => {
    tempDir = await makeTempDir('index-serve-');
    const app = serve({ cwd: tempDir, plugins: [] });
    const document = {
      id: 'doc-id',
      loader: {
        absolute: async () => '/abs/page.tsx',
        import: async () => ({ default: 'page-module' })
      },
      render: {
        renderMarkup: async (props: Record<string, unknown>) => `html:${props.message}`
      }
    };

    (app.server.manifest as any).set = async () => document;

    expect(app.server).to.be.instanceOf(Server);
    expect(app.config.production).to.equal(true);
    expect(await app.absolute('@/pages/home.tsx')).to.equal('/abs/page.tsx');
    expect(await app.id('@/pages/home.tsx')).to.equal('doc-id');
    expect(await app.importPage('@/pages/home.tsx')).to.deep.equal({ default: 'page-module' });
    expect(await app.render('@/pages/home.tsx', { message: 'hello' })).to.equal('html:hello');
  });

  it('default engine() exposes combined builder, loader, and document helpers', async () => {
    tempDir = await makeTempDir('index-engine-');
    const app = engine({ cwd: tempDir, plugins: [] });
    const document = {
      id: 'doc-id',
      builder: {
        buildAssets: async () => ['asset-output'],
        buildClient: async () => ['client-output'],
        buildPage: async (assets?: unknown[]) => assets ?? ['page-output']
      },
      loader: {
        absolute: async () => '/abs/page.tsx',
        import: async () => ({ default: 'page-module' }),
        relative: async () => './home.tsx'
      },
      render: {
        renderHMRClient: async () => 'hmr-client',
        renderMarkup: async (props: Record<string, unknown>) => `html:${props.message}`
      }
    };

    let forEachCalls = 0;
    Object.defineProperty(app.builder.manifest, 'size', { configurable: true, get: () => 3 });
    (app.builder.manifest as any).set = async () => document;
    (app.builder.manifest as any).entries = () => [['@/pages/home.tsx', document]];
    (app.builder.manifest as any).find = (id: string) => id === 'doc-id' ? document : null;
    (app.builder.manifest as any).forEach = (callback: (value: unknown) => void) => {
      forEachCalls++;
      callback(document);
    };
    (app.builder.manifest as any).get = (entry: string) => entry === '@/pages/home.tsx' ? document : null;
    (app.builder.manifest as any).has = () => true;
    (app.builder.manifest as any).load = (hash: Record<string, string>) => hash;
    (app.builder.manifest as any).open = async (file: string) => ({ file });
    (app.builder.manifest as any).map = (callback: (value: unknown) => unknown) => [callback(document)];
    (app.builder.manifest as any).save = async (file: string) => file;
    (app.builder.manifest as any).toJSON = () => ({ '@/pages/home.tsx': 'doc-id' });
    (app.builder.manifest as any).values = () => [document];
    (app.builder as any).buildAssets = async () => ['all-assets'];
    (app.builder as any).buildClients = async () => ['all-clients'];
    (app.builder as any).buildPages = async () => ['all-pages'];
    (app.builder.resource as any).build = async (config: unknown) => config;
    (app.builder.resource as any).dev = async () => 'dev-server';
    (app.builder.resource as any).middlewares = async () => 'middlewares';
    (app.builder.resource as any).plugins = async () => ['plugin'];
    (app.builder.loader as any).fetch = async (url: string) => ({ url });
    (app.builder.loader as any).import = async (pathname: string, extnames: string[]) => ({ pathname, extnames });
    (app.builder.loader as any).resolve = async (pathname: string, extnames: string[]) => ({ pathname, extnames });
    (app.builder as any).http = async () => 'http-result';

    expect(app.builder).to.be.instanceOf(Builder);
    expect(app.size).to.equal(3);
    expect(await app.build({ build: { write: false } } as any)).to.deep.equal({ build: { write: false } });
    expect(await app.dev()).to.equal('dev-server');
    expect(await app.http({} as any, {} as any)).to.equal('http-result');
    expect(await app.middlewares()).to.equal('middlewares');
    expect(await app.plugins()).to.deep.equal(['plugin']);
    expect(await app.fetch('file:///tmp/example.tsx')).to.deep.equal({ url: 'file:///tmp/example.tsx' });
    expect(await app.import('/tmp/example', ['.js'])).to.deep.equal({ pathname: '/tmp/example', extnames: ['.js'] });
    expect(await app.resolve('/tmp/example', ['.tsx'])).to.deep.equal({ pathname: '/tmp/example', extnames: ['.tsx'] });
    expect(await app.buildAllAssets()).to.deep.equal(['all-assets']);
    expect(await app.buildAllClients()).to.deep.equal(['all-clients']);
    expect(await app.buildAllPages()).to.deep.equal(['all-pages']);
    expect(app.entries()).to.deep.equal([['@/pages/home.tsx', document]]);
    expect(app.find('doc-id')).to.equal(document);
    app.forEach(() => {});
    expect(forEachCalls).to.equal(1);
    expect(app.get('@/pages/home.tsx')).to.equal(document);
    expect(app.has('@/pages/home.tsx')).to.equal(true);
    expect(app.load({ a: 'b' })).to.deep.equal({ a: 'b' });
    expect(await app.open('manifest.json')).to.deep.equal({ file: 'manifest.json' });
    expect(app.map((value) => value)).to.deep.equal([document]);
    expect(await app.save('manifest.json')).to.equal('manifest.json');
    expect(await app.set('@/pages/home.tsx')).to.equal(document);
    expect(app.toJSON()).to.deep.equal({ '@/pages/home.tsx': 'doc-id' });
    expect(app.values()).to.deep.equal([document]);
    expect(await app.absolute('@/pages/home.tsx')).to.equal('/abs/page.tsx');
    expect(await app.id('@/pages/home.tsx')).to.equal('doc-id');
    expect(await app.importPage('@/pages/home.tsx')).to.deep.equal({ default: 'page-module' });
    expect(await app.relative('@/pages/home.tsx', '/tmp/page.tsx')).to.equal('./home.tsx');
    expect(await app.buildAssets('@/pages/home.tsx')).to.deep.equal(['asset-output']);
    expect(await app.buildClient('@/pages/home.tsx')).to.deep.equal(['client-output']);
    expect(await app.buildPage('@/pages/home.tsx', ['styles'] as any)).to.deep.equal(['styles']);
    expect(await app.renderHMR('@/pages/home.tsx')).to.equal('hmr-client');
    expect(await app.render('@/pages/home.tsx', { message: 'hello' })).to.equal('html:hello');
  });
});
