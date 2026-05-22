//tests
import { describe, it } from 'mocha';
import { expect } from 'chai';
//modules
import NodeFS from '@stackpress/lib/NodeFS';
//reactus
import Server from '../src/Server.js';
import ServerLoader from '../src/ServerLoader.js';
import ServerManifest from '../src/ServerManifest.js';
import ServerResource from '../src/ServerResource.js';
import VirtualServer from '../src/VirtualServer.js';
import {
  PAGE_TEMPLATE,
  CLIENT_TEMPLATE,
  DOCUMENT_TEMPLATE
} from '../src/constants.js';
import { withPatched } from './helpers.js';

describe('Server', () => {
  describe('configure', () => {
    it('returns default configuration with minimal options', () => {
      const config = Server.configure({});
      expect(config.basePath).to.equal('/');
      expect(config.clientRoute).to.equal('/client');
      expect(config.cssRoute).to.equal('/assets');
      expect(config.production).to.equal(true);
    });

    it('merges provided options with defaults', () => {
      const config = Server.configure({
        basePath: '/base',
        clientRoute: '/scripts',
        cssRoute: '/styles',
        production: false
      });

      expect(config.basePath).to.equal('/base');
      expect(config.clientRoute).to.equal('/scripts');
      expect(config.cssRoute).to.equal('/styles');
      expect(config.production).to.equal(false);
    });

    it('handles custom paths and templates', () => {
      const config = Server.configure({
        cwd: '/tmp/project',
        assetPath: '/tmp/assets',
        clientPath: '/tmp/client',
        pagePath: '/tmp/page',
        pageTemplate: '<page/>',
        clientTemplate: '<client/>',
        documentTemplate: '<html/>'
      });

      expect(config.assetPath).to.equal('/tmp/assets');
      expect(config.clientPath).to.equal('/tmp/client');
      expect(config.pagePath).to.equal('/tmp/page');
      expect(config.pageTemplate).to.equal('<page/>');
      expect(config.clientTemplate).to.equal('<client/>');
      expect(config.documentTemplate).to.equal('<html/>');
    });

    it('handles css files, vite config, and frozen results', () => {
      const vite = { appType: 'custom' } as any;
      const fs = new NodeFS();
      const config = Server.configure({
        cssFiles: ['/global.css'],
        vite,
        fs
      });

      expect(config.cssFiles).to.deep.equal(['/global.css']);
      expect(config.vite).to.equal(vite);
      expect(config.fs).to.equal(fs);
      expect(Object.isFrozen(config)).to.equal(true);
    });

    it('uses process.cwd() when cwd is not provided', () => {
      const config = Server.configure({});
      expect(config.cwd).to.equal(process.cwd());
      expect(config.assetPath).to.include('.reactus/assets');
      expect(config.clientPath).to.include('.reactus/client');
      expect(config.pagePath).to.include('.reactus/page');
    });
  });

  describe('constructor and getters', () => {
    it('initializes production and development configurations', () => {
      const productionServer = new Server(Server.configure({ production: true }));
      const developmentServer = new Server(Server.configure({ production: false }));

      expect(productionServer.production).to.equal(true);
      expect(developmentServer.production).to.equal(false);
    });

    it('initializes custom file system, vite config, and component references', () => {
      const fs = new NodeFS();
      const vite = { resolve: { alias: { '@': '/tmp' } } } as any;
      const config = Server.configure({
        fs,
        vite,
        cssFiles: ['/global.css']
      });
      const server = new Server(config);

      expect(server.loader).to.be.instanceOf(ServerLoader);
      expect(server.manifest).to.be.instanceOf(ServerManifest);
      expect(server.resource).to.be.instanceOf(ServerResource);
      expect(server.vfs).to.be.instanceOf(VirtualServer);
      expect(server.loader.fs).to.equal(fs);
      expect(server.resource.config).to.equal(vite);
      expect(server.paths.css).to.deep.equal(['/global.css']);
      expect(server.routes.client).to.equal('/client');
      expect(server.templates.client).to.equal(CLIENT_TEMPLATE);
      expect(server.templates.document).to.equal(DOCUMENT_TEMPLATE);
      expect(server.templates.page).to.equal(PAGE_TEMPLATE);
    });
  });

  describe('http', () => {
    it('calls resource middlewares and resolves when next is called', async () => {
      const server = new Server(Server.configure({ production: false }));
      let called = 0;
      const req = { url: '/hello' } as any;
      const res = {} as any;

      const middlewares = ((receivedReq: unknown, receivedRes: unknown, next: (value?: unknown) => void) => {
        called++;
        expect(receivedReq).to.equal(req);
        expect(receivedRes).to.equal(res);
        next();
      }) as any;

      const result = await withPatched(server.resource, 'middlewares', (async () => middlewares) as any, async () => {
        return await server.http(req, res);
      });

      expect(called).to.equal(1);
      expect(result).to.equal(undefined);
    });

    it('propagates middleware lookup errors', async () => {
      const server = new Server(Server.configure({ production: false }));
      const forced = new Error('middlewares failed');

      try {
        await withPatched(server.resource, 'middlewares', (async () => { throw forced; }) as any, async () => {
          await server.http({} as any, {} as any);
        });
        expect.fail('should have thrown');
      } catch (error: unknown) {
        expect(error).to.equal(forced);
      }
    });

    it('returns the next() resolution value', async () => {
      const server = new Server(Server.configure({ production: false }));
      const middlewares = ((_req: unknown, _res: unknown, next: (value?: unknown) => void) => next('done')) as any;

      const result = await withPatched(server.resource, 'middlewares', (async () => middlewares) as any, async () => {
        return await server.http({} as any, {} as any);
      });

      expect(result).to.equal('done');
    });
  });
});
