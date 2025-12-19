import type { Plugin, ViteDevServer } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { css, file, hmr, vfs } from '../src/plugins.js';
import ServerLoader from '../src/ServerLoader.js';
import VirtualServer from '../src/VirtualServer.js';
import Server from '../src/Server.js';

// Mock dependencies
jest.mock('../src/ServerLoader.js');
jest.mock('../src/VirtualServer.js');
jest.mock('../src/Server.js');

const MockedVirtualServer = VirtualServer as jest.MockedClass<typeof VirtualServer>;

// Helper to get transform function from plugin
function getTransformFunction(plugin: Plugin) {
  const transform = plugin.transform;
  if (typeof transform === 'function') {
    return transform;
  } else if (transform && typeof transform === 'object' && 'handler' in transform) {
    return transform.handler;
  }
  throw new Error('Transform function not found');
}

describe('plugins', () => {
  describe('css()', () => {
    it('returns a Vite plugin with correct name', () => {
      const cssFiles = ['/styles/main.css', '/styles/theme.css'];
      const plugin = css(cssFiles);
      
      expect(plugin.name).toBe('reactus-inject-css');
      expect(plugin.enforce).toBe('pre');
    });

    it('injects CSS imports into TSX files', () => {
      const cssFiles = ['/styles/main.css', '/styles/theme.css'];
      const plugin = css(cssFiles);
      const originalCode = 'export default function Component() { return <div>Hello</div>; }';
      
      const transformFn = getTransformFunction(plugin);
      const result = transformFn.call({} as any, originalCode, '/path/to/component.tsx');
      
      expect(result).toBe(
        "import '/styles/main.css';\nimport '/styles/theme.css';\n" + originalCode
      );
    });

    it('does not transform non-TSX files', () => {
      const cssFiles = ['/styles/main.css'];
      const plugin = css(cssFiles);
      const originalCode = 'console.log("test");';
      
      const transformFn = getTransformFunction(plugin);
      const result = transformFn.call({} as any, originalCode, '/path/to/script.js');
      
      expect(result).toBe(originalCode);
    });

    it('handles empty CSS files array', () => {
      const cssFiles: string[] = [];
      const plugin = css(cssFiles);
      const originalCode = 'export default function Component() { return <div>Hello</div>; }';
      
      const transformFn = getTransformFunction(plugin);
      const result = transformFn.call({} as any, originalCode, '/path/to/component.tsx');
      
      expect(result).toBe('\n' + originalCode);
    });

    it('handles single CSS file', () => {
      const cssFiles = ['/styles/main.css'];
      const plugin = css(cssFiles);
      const originalCode = 'export default function Component() { return <div>Hello</div>; }';
      
      const transformFn = getTransformFunction(plugin);
      const result = transformFn.call({} as any, originalCode, '/path/to/component.tsx');
      
      expect(result).toBe("import '/styles/main.css';\n" + originalCode);
    });
  });

  describe('file()', () => {
    let mockLoader: jest.Mocked<ServerLoader>;

    beforeEach(() => {
      mockLoader = {
        cwd: '/project',
        fs: {} as any,
        _loader: {} as any,
        _production: false,
        _resource: {} as any,
        absolute: jest.fn(),
        fetch: jest.fn(),
        import: jest.fn(),
        relative: jest.fn(),
        resolveFile: jest.fn(),
        resolve: jest.fn()
      } as unknown as jest.Mocked<ServerLoader>;
    });

    it('returns a Vite plugin with correct name', () => {
      const plugin = file(mockLoader);
      
      expect(plugin.name).toBe('reactus-file-loader');
    });

    it('skips absolute paths', async () => {
      const plugin = file(mockLoader);
      
      const result = await plugin.resolveId!('/absolute/path', undefined);
      
      expect(result).toBeUndefined();
      expect(mockLoader.resolveFile).not.toHaveBeenCalled();
    });

    it('resolves files using loader', async () => {
      const plugin = file(mockLoader);
      mockLoader.resolveFile.mockResolvedValue('/resolved/path/module.ts');
      
      const result = await plugin.resolveId!('module', undefined);
      
      expect(result).toBe('/resolved/path/module.ts');
      expect(mockLoader.resolveFile).toHaveBeenCalledWith(
        'module',
        ['.js', '.ts', '.tsx'],
        '/project'
      );
    });

    it('uses cache for repeated requests', async () => {
      const plugin = file(mockLoader);
      mockLoader.resolveFile.mockResolvedValue('/resolved/path/module.ts');
      
      // First call
      const result1 = await plugin.resolveId!('module', undefined);
      // Second call
      const result2 = await plugin.resolveId!('module', undefined);
      
      expect(result1).toBe('/resolved/path/module.ts');
      expect(result2).toBe('/resolved/path/module.ts');
      expect(mockLoader.resolveFile).toHaveBeenCalledTimes(1);
    });

    it('handles importer directory resolution', async () => {
      const plugin = file(mockLoader);
      mockLoader.resolveFile.mockResolvedValue('/resolved/path/module.ts');
      
      await plugin.resolveId!('module', '/project/src/components/Button.tsx');
      
      expect(mockLoader.resolveFile).toHaveBeenCalledWith(
        'module',
        ['.js', '.ts', '.tsx'],
        '/project/src/components'
      );
    });

    it('handles imfs importer paths', async () => {
      const plugin = file(mockLoader);
      mockLoader.resolveFile.mockResolvedValue('/resolved/path/module.ts');
      
      await plugin.resolveId!('module', 'imfs:text/typescript;base64,data;/foo/bar.tsx');
      
      expect(mockLoader.resolveFile).toHaveBeenCalledWith(
        'module',
        ['.js', '.ts', '.tsx'],
        '/foo'
      );
    });

    it('returns undefined when file cannot be resolved', async () => {
      const plugin = file(mockLoader);
      mockLoader.resolveFile.mockResolvedValue(null);
      
      const result = await plugin.resolveId!('non-existent', undefined);
      
      expect(result).toBeUndefined();
    });

    it('uses custom extensions', async () => {
      const plugin = file(mockLoader, ['.vue', '.svelte']);
      mockLoader.resolveFile.mockResolvedValue('/resolved/path/component.vue');
      
      await plugin.resolveId!('component', undefined);
      
      expect(mockLoader.resolveFile).toHaveBeenCalledWith(
        'component',
        ['.vue', '.svelte'],
        '/project'
      );
    });
  });

  describe('hmr()', () => {
    let mockServer: jest.Mocked<Server>;
    let mockReq: Partial<IncomingMessage>;
    let mockRes: Partial<ServerResponse>;
    let mockNext: jest.Mock;
    let mockDocument: any;

    beforeEach(() => {
      const mockManifest = {
        find: jest.fn()
      };
      
      mockServer = {
        routes: { client: '/client' },
        manifest: mockManifest
      } as unknown as jest.Mocked<Server>;

      mockReq = { url: '' };
      mockRes = { 
        get headersSent() { return false; },
        setHeader: jest.fn(),
        end: jest.fn()
      } as Partial<ServerResponse>;
      mockNext = jest.fn();

      mockDocument = {
        render: {
          renderHMRClient: jest.fn()
        }
      };
    });

    it('returns middleware function', () => {
      const middleware = hmr(mockServer);
      
      expect(typeof middleware).toBe('function');
    });

    it('skips when no URL', async () => {
      const middleware = hmr(mockServer);
      mockReq.url = undefined;
      
      await middleware(mockReq as IncomingMessage, mockRes as ServerResponse, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.end).not.toHaveBeenCalled();
    });

    it('skips when URL does not start with client route', async () => {
      const middleware = hmr(mockServer);
      mockReq.url = '/other/path';
      
      await middleware(mockReq as IncomingMessage, mockRes as ServerResponse, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.end).not.toHaveBeenCalled();
    });

    it('skips when URL does not end with .tsx', async () => {
      const middleware = hmr(mockServer);
      mockReq.url = '/client/file.js';
      
      await middleware(mockReq as IncomingMessage, mockRes as ServerResponse, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.end).not.toHaveBeenCalled();
    });

    it('skips when headers already sent', async () => {
      const middleware = hmr(mockServer);
      mockReq.url = '/client/abc-123.tsx';
      Object.defineProperty(mockRes, 'headersSent', { value: true });
      
      await middleware(mockReq as IncomingMessage, mockRes as ServerResponse, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.end).not.toHaveBeenCalled();
    });

    it('serves HMR client when document found', async () => {
      const middleware = hmr(mockServer);
      mockReq.url = '/client/abc-123.tsx';
      (mockServer.manifest.find as jest.Mock).mockReturnValue(mockDocument);
      mockDocument.render.renderHMRClient.mockResolvedValue('client code');
      
      await middleware(mockReq as IncomingMessage, mockRes as ServerResponse, mockNext);
      
      expect(mockServer.manifest.find).toHaveBeenCalledWith('abc-123');
      expect(mockDocument.render.renderHMRClient).toHaveBeenCalled();
      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'text/javascript');
      expect(mockRes.end).toHaveBeenCalledWith('client code');
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('calls next when document not found', async () => {
      const middleware = hmr(mockServer);
      mockReq.url = '/client/abc-123.tsx';
      (mockServer.manifest.find as jest.Mock).mockReturnValue(null);
      
      await middleware(mockReq as IncomingMessage, mockRes as ServerResponse, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.end).not.toHaveBeenCalled();
    });

    it('calls next when HMR client is null', async () => {
      const middleware = hmr(mockServer);
      mockReq.url = '/client/abc-123.tsx';
      (mockServer.manifest.find as jest.Mock).mockReturnValue(mockDocument);
      mockDocument.render.renderHMRClient.mockResolvedValue(null);
      
      await middleware(mockReq as IncomingMessage, mockRes as ServerResponse, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.end).not.toHaveBeenCalled();
    });

    it('extracts correct ID from URL', async () => {
      const middleware = hmr(mockServer);
      mockReq.url = '/client/my-component-xyz.tsx';
      (mockServer.manifest.find as jest.Mock).mockReturnValue(mockDocument);
      mockDocument.render.renderHMRClient.mockResolvedValue('client code');
      
      await middleware(mockReq as IncomingMessage, mockRes as ServerResponse, mockNext);
      
      expect(mockServer.manifest.find).toHaveBeenCalledWith('my-component-xyz');
    });
  });

  describe('vfs()', () => {
    let mockVfs: jest.Mocked<VirtualServer>;
    let mockViteServer: Partial<ViteDevServer>;

    beforeEach(() => {
      mockVfs = new MockedVirtualServer() as jest.Mocked<VirtualServer>;
      mockVfs.has = jest.fn();
      mockVfs.get = jest.fn();

      mockViteServer = {
        watcher: {
          on: jest.fn()
        },
        ws: {
          send: jest.fn()
        },
        moduleGraph: {
          getModuleById: jest.fn(),
          invalidateModule: jest.fn()
        }
      } as any;
    });

    it('returns a Vite plugin with correct name', () => {
      const plugin = vfs(mockVfs);
      
      expect(plugin.name).toBe('reactus-virtual-loader');
    });

    it('configures server watcher for VFS changes', () => {
      const plugin = vfs(mockVfs);
      
      plugin.configureServer!(mockViteServer as ViteDevServer);
      
      expect(mockViteServer.watcher!.on).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('handles VFS file changes with module invalidation', () => {
      const plugin = vfs(mockVfs);
      const mockModule = { id: 'virtual:reactus:/test.tsx' };
      mockViteServer.moduleGraph!.getModuleById = jest.fn().mockReturnValue(mockModule);
      
      plugin.configureServer!(mockViteServer as ViteDevServer);
      
      // Get the change handler
      const changeHandler = (mockViteServer.watcher!.on as jest.Mock).mock.calls[0][1];
      changeHandler('virtual:reactus:/test.tsx');
      
      expect(mockViteServer.moduleGraph!.getModuleById).toHaveBeenCalledWith('virtual:reactus:/test.tsx');
      expect(mockViteServer.moduleGraph!.invalidateModule).toHaveBeenCalledWith(mockModule);
      expect(mockViteServer.ws!.send).toHaveBeenCalledWith({ type: 'full-reload', path: '*' });
    });

    it('resolves VFS protocol sources', () => {
      const plugin = vfs(mockVfs);
      
      const result = plugin.resolveId!('virtual:reactus:/test.tsx', undefined);
      
      expect(result).toBe('virtual:reactus:/test.tsx');
    });

    it('resolves sources containing VFS protocol', () => {
      const plugin = vfs(mockVfs);
      
      const result = plugin.resolveId!('some/path/virtual:reactus:/test.tsx', undefined);
      
      expect(result).toBe('virtual:reactus:/test.tsx');
    });

    it('resolves relative imports from VFS files', () => {
      const plugin = vfs(mockVfs);
      
      const result = plugin.resolveId!('./component.tsx', 'virtual:reactus:/src/pages/home.tsx');
      
      expect(result).toBe('/src/pages/component.tsx');
    });

    it('resolves relative imports with parent directory', () => {
      const plugin = vfs(mockVfs);
      
      const result = plugin.resolveId!('../utils/helper.ts', 'virtual:reactus:/src/pages/home.tsx');
      
      expect(result).toBe('/src/utils/helper.ts');
    });

    it('preserves extension when resolving relative imports', () => {
      const plugin = vfs(mockVfs);
      
      const result = plugin.resolveId!('./component.js', 'virtual:reactus:/src/pages/home.tsx');
      
      expect(result).toBe('/src/pages/component.js');
    });

    it('loads VFS file contents', () => {
      const plugin = vfs(mockVfs);
      mockVfs.has.mockReturnValue(true);
      mockVfs.get.mockReturnValue('file contents');
      
      const result = plugin.load!('virtual:reactus:/test.tsx');
      
      expect(mockVfs.has).toHaveBeenCalledWith('/test.tsx');
      expect(mockVfs.get).toHaveBeenCalledWith('/test.tsx');
      expect(result).toBe('file contents');
    });

    it('returns null when VFS file does not exist', () => {
      const plugin = vfs(mockVfs);
      mockVfs.has.mockReturnValue(false);
      
      const result = plugin.load!('virtual:reactus:/non-existent.tsx');
      
      expect(result).toBeNull();
    });

    it('returns null when VFS returns non-string content', () => {
      const plugin = vfs(mockVfs);
      mockVfs.has.mockReturnValue(true);
      mockVfs.get.mockReturnValue(null);
      
      const result = plugin.load!('virtual:reactus:/test.tsx');
      
      expect(result).toBeNull();
    });

    it('returns undefined for non-VFS sources in resolveId', () => {
      const plugin = vfs(mockVfs);
      
      const result = plugin.resolveId!('regular-module', undefined);
      
      expect(result).toBeUndefined();
    });

    it('returns undefined for non-VFS sources in load', () => {
      const plugin = vfs(mockVfs);
      
      const result = plugin.load!('/regular/file.tsx');
      
      expect(result).toBeUndefined();
    });
  });
});
