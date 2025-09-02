import Server from '../src/Server.js';
import ServerLoader from '../src/ServerLoader.js';
import ServerManifest from '../src/ServerManifest.js';
import ServerResource from '../src/ServerResource.js';
import VirtualServer from '../src/VirtualServer.js';
import NodeFS from '@stackpress/lib/NodeFS';
import type { ServerConfig, IM, SR } from '../src/types.js';
import { 
  PAGE_TEMPLATE,
  CLIENT_TEMPLATE, 
  DOCUMENT_TEMPLATE
} from '../src/constants.js';

// Mock dependencies
jest.mock('../src/ServerLoader.js');
jest.mock('../src/ServerManifest.js');
jest.mock('../src/ServerResource.js');
jest.mock('../src/VirtualServer.js');
jest.mock('@stackpress/lib/NodeFS');

const MockedServerLoader = ServerLoader as jest.MockedClass<typeof ServerLoader>;
const MockedServerManifest = ServerManifest as jest.MockedClass<typeof ServerManifest>;
const MockedServerResource = ServerResource as jest.MockedClass<typeof ServerResource>;
const MockedVirtualServer = VirtualServer as jest.MockedClass<typeof VirtualServer>;
const MockedNodeFS = NodeFS as jest.MockedClass<typeof NodeFS>;

describe('Server', () => {
  let mockFs: jest.Mocked<NodeFS>;
  let mockVfs: jest.Mocked<VirtualServer>;
  let mockLoader: jest.Mocked<ServerLoader>;
  let mockManifest: jest.Mocked<ServerManifest>;
  let mockResource: jest.Mocked<ServerResource>;

  const makeServerConfig = (overrides: Partial<ServerConfig> = {}): ServerConfig => ({
    assetPath: '/project/.reactus/assets',
    basePath: '/',
    clientPath: '/project/.reactus/client',
    clientRoute: '/client',
    clientTemplate: CLIENT_TEMPLATE,
    cssRoute: '/assets',
    cwd: '/project',
    documentTemplate: DOCUMENT_TEMPLATE,
    pagePath: '/project/.reactus/page',
    pageTemplate: PAGE_TEMPLATE,
    plugins: [],
    production: true,
    ...overrides
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock NodeFS
    mockFs = new MockedNodeFS() as jest.Mocked<NodeFS>;

    // Mock VirtualServer
    mockVfs = new MockedVirtualServer() as jest.Mocked<VirtualServer>;
    MockedVirtualServer.mockImplementation(() => mockVfs);

    // Mock ServerLoader
    mockLoader = new MockedServerLoader({} as any) as jest.Mocked<ServerLoader>;
    MockedServerLoader.mockImplementation(() => mockLoader);

    // Mock ServerManifest
    mockManifest = new MockedServerManifest({} as any) as jest.Mocked<ServerManifest>;
    MockedServerManifest.mockImplementation(() => mockManifest);

    // Mock ServerResource
    mockResource = new MockedServerResource({} as any, {} as any) as jest.Mocked<ServerResource>;
    mockResource.middlewares = jest.fn();
    MockedServerResource.mockImplementation(() => mockResource);
  });

  describe('configure', () => {
    it('should return default configuration with minimal options', () => {
      const mockCwd = jest.spyOn(process, 'cwd').mockReturnValue('/project');
      
      const config = Server.configure({});

      expect(config.assetPath).toBe('/project/.reactus/assets');
      expect(config.basePath).toBe('/');
      expect(config.clientPath).toBe('/project/.reactus/client');
      expect(config.clientRoute).toBe('/client');
      expect(config.clientTemplate).toBe(CLIENT_TEMPLATE);
      expect(config.cssRoute).toBe('/assets');
      expect(config.cwd).toBe('/project');
      expect(config.documentTemplate).toBe(DOCUMENT_TEMPLATE);
      expect(config.pagePath).toBe('/project/.reactus/page');
      expect(config.pageTemplate).toBe(PAGE_TEMPLATE);
      expect(config.plugins).toEqual([]);
      expect(config.production).toBe(true);
      expect(config.watchIgnore).toEqual([]);
      expect(config.fs).toBeInstanceOf(NodeFS);
      
      mockCwd.mockRestore();
    });

    it('should merge provided options with defaults', () => {
      const customOptions = {
        cwd: '/custom',
        production: false,
        clientRoute: '/custom-client',
        cssRoute: '/custom-assets',
        basePath: '/app',
        plugins: ['plugin1', 'plugin2'] as any[],
        watchIgnore: ['node_modules', '.git']
      };

      const config = Server.configure(customOptions);

      expect(config.cwd).toBe('/custom');
      expect(config.production).toBe(false);
      expect(config.clientRoute).toBe('/custom-client');
      expect(config.cssRoute).toBe('/custom-assets');
      expect(config.basePath).toBe('/app');
      expect(config.plugins).toEqual(['plugin1', 'plugin2']);
      expect(config.watchIgnore).toEqual(['node_modules', '.git']);
      expect(config.assetPath).toBe('/custom/.reactus/assets');
      expect(config.clientPath).toBe('/custom/.reactus/client');
      expect(config.pagePath).toBe('/custom/.reactus/page');
    });

    it('should handle custom paths', () => {
      const customOptions = {
        cwd: '/app',
        assetPath: '/app/dist/assets',
        clientPath: '/app/dist/client',
        pagePath: '/app/dist/page'
      };

      const config = Server.configure(customOptions);

      expect(config.assetPath).toBe('/app/dist/assets');
      expect(config.clientPath).toBe('/app/dist/client');
      expect(config.pagePath).toBe('/app/dist/page');
    });

    it('should handle custom templates', () => {
      const customTemplates = {
        clientTemplate: 'custom client template',
        documentTemplate: 'custom document template',
        pageTemplate: 'custom page template'
      };

      const config = Server.configure(customTemplates);

      expect(config.clientTemplate).toBe('custom client template');
      expect(config.documentTemplate).toBe('custom document template');
      expect(config.pageTemplate).toBe('custom page template');
    });

    it('should handle CSS files configuration', () => {
      const config = Server.configure({
        cssFiles: ['global.css', 'theme.css']
      });

      expect(config.cssFiles).toEqual(['global.css', 'theme.css']);
    });

    it('should handle Vite configuration', () => {
      const mockCwd = jest.spyOn(process, 'cwd').mockReturnValue('/project');
      
      const viteConfig = {
        define: { __DEV__: true },
        server: { port: 3000 }
      };

      const config = Server.configure({
        vite: viteConfig,
        optimizeDeps: { include: ['react'] }
      });

      expect(config.vite).toEqual(viteConfig);
      expect(config.optimizeDeps).toEqual({ include: ['react'] });
      
      mockCwd.mockRestore();
    });

    it('should return frozen configuration object', () => {
      const config = Server.configure({});

      expect(Object.isFrozen(config)).toBe(true);
      expect(() => {
        (config as any).production = false;
      }).toThrow();
    });

    it('should use process.cwd() when cwd is not provided', () => {
      const mockCwd = jest.spyOn(process, 'cwd').mockReturnValue('/mock-cwd');

      const config = Server.configure({});

      expect(config.cwd).toBe('/mock-cwd');
      expect(config.assetPath).toBe('/mock-cwd/.reactus/assets');

      mockCwd.mockRestore();
    });
  });

  describe('constructor', () => {
    it('should initialize with production configuration', () => {
      const config = makeServerConfig({ production: true });
      const server = new Server(config);

      expect(server.production).toBe(true);
      expect(MockedVirtualServer).toHaveBeenCalled();
      expect(MockedServerManifest).toHaveBeenCalledWith(server);
      expect(MockedServerResource).toHaveBeenCalledWith(server, {
        basePath: '/',
        config: undefined,
        cwd: '/project',
        optimizeDeps: undefined,
        plugins: [],
        watchIgnore: undefined
      });
      expect(MockedServerLoader).toHaveBeenCalledWith({
        fs: undefined,
        cwd: '/project',
        resource: mockResource,
        production: true
      });
    });

    it('should initialize with development configuration', () => {
      const config = makeServerConfig({ 
        production: false,
        basePath: '/dev',
        plugins: ['plugin1'] as any[],
        watchIgnore: ['node_modules']
      });
      const server = new Server(config);

      expect(server.production).toBe(false);
      expect(MockedServerResource).toHaveBeenCalledWith(server, {
        basePath: '/dev',
        config: undefined,
        cwd: '/project',
        optimizeDeps: undefined,
        plugins: ['plugin1'],
        watchIgnore: ['node_modules']
      });
      expect(MockedServerLoader).toHaveBeenCalledWith({
        fs: undefined,
        cwd: '/project',
        resource: mockResource,
        production: false
      });
    });

    it('should initialize with custom file system', () => {
      const config = makeServerConfig({ fs: mockFs });
      new Server(config);

      expect(MockedServerLoader).toHaveBeenCalledWith({
        fs: mockFs,
        cwd: '/project',
        resource: mockResource,
        production: true
      });
    });

    it('should initialize with Vite configuration', () => {
      const viteConfig = { define: { __DEV__: true } };
      const config = makeServerConfig({ 
        vite: viteConfig,
        optimizeDeps: { include: ['react'] }
      });
      const server = new Server(config);

      expect(MockedServerResource).toHaveBeenCalledWith(server, {
        basePath: '/',
        config: viteConfig,
        cwd: '/project',
        optimizeDeps: { include: ['react'] },
        plugins: [],
        watchIgnore: undefined
      });
    });

    it('should set up component references correctly', () => {
      const config = makeServerConfig();
      const server = new Server(config);

      expect(server.loader).toBe(mockLoader);
      expect(server.manifest).toBe(mockManifest);
      expect(server.resource).toBe(mockResource);
      expect(server.vfs).toBe(mockVfs);
    });
  });

  describe('getters', () => {
    let server: Server;

    beforeEach(() => {
      const config = makeServerConfig({
        assetPath: '/custom/assets',
        clientPath: '/custom/client',
        pagePath: '/custom/page',
        cssFiles: ['global.css'],
        clientRoute: '/custom-client',
        cssRoute: '/custom-css',
        clientTemplate: 'custom client',
        documentTemplate: 'custom document',
        pageTemplate: 'custom page'
      });
      server = new Server(config);
    });

    describe('paths', () => {
      it('should return frozen paths object', () => {
        const paths = server.paths;

        expect(paths.asset).toBe('/custom/assets');
        expect(paths.client).toBe('/custom/client');
        expect(paths.page).toBe('/custom/page');
        expect(paths.css).toEqual(['global.css']);
        expect(Object.isFrozen(paths)).toBe(true);
      });

      it('should handle undefined CSS files', () => {
        const config = makeServerConfig({ cssFiles: undefined });
        const serverNoCss = new Server(config);

        expect(serverNoCss.paths.css).toBeUndefined();
      });
    });

    describe('routes', () => {
      it('should return frozen routes object', () => {
        const routes = server.routes;

        expect(routes.client).toBe('/custom-client');
        expect(routes.css).toBe('/custom-css');
        expect(Object.isFrozen(routes)).toBe(true);
      });
    });

    describe('templates', () => {
      it('should return frozen templates object', () => {
        const templates = server.templates;

        expect(templates.client).toBe('custom client');
        expect(templates.document).toBe('custom document');
        expect(templates.page).toBe('custom page');
        expect(Object.isFrozen(templates)).toBe(true);
      });
    });
  });

  describe('http', () => {
    let server: Server;
    let mockReq: IM;
    let mockRes: SR;
    let mockMiddlewares: jest.Mock;

    beforeEach(() => {
      const config = makeServerConfig();
      server = new Server(config);

      mockReq = {} as IM;
      mockRes = {} as SR;
      mockMiddlewares = jest.fn();
      // Mock middlewares to return a function that can be called
      mockResource.middlewares.mockResolvedValue(mockMiddlewares as any);
    });

    it('should call resource middlewares and return promise', async () => {
      mockMiddlewares.mockImplementation((req, res, next) => {
        expect(req).toBe(mockReq);
        expect(res).toBe(mockRes);
        expect(typeof next).toBe('function');
        next();
      });

      await server.http(mockReq, mockRes);

      expect(mockResource.middlewares).toHaveBeenCalled();
      expect(mockMiddlewares).toHaveBeenCalledWith(
        mockReq,
        mockRes,
        expect.any(Function)
      );
    });

    it('should handle middleware errors', async () => {
      const error = new Error('Middleware failed');
      mockResource.middlewares.mockRejectedValue(error);

      await expect(server.http(mockReq, mockRes)).rejects.toThrow('Middleware failed');
    });

    it('should pass correct parameters to middlewares', async () => {
      mockMiddlewares.mockImplementation((_req, _res, next) => next());

      await server.http(mockReq, mockRes);

      expect(mockMiddlewares).toHaveBeenCalledWith(
        mockReq,
        mockRes,
        expect.any(Function)
      );
    });
  });

  describe('integration', () => {
    it('should create server with all components properly connected', () => {
      const config = makeServerConfig({
        production: false,
        cwd: '/test-project',
        assetPath: '/test-project/.reactus/assets',
        fs: mockFs
      });

      const server = new Server(config);

      // Verify all components are created
      expect(server.vfs).toBeDefined();
      expect(server.loader).toBeDefined();
      expect(server.manifest).toBeDefined();
      expect(server.resource).toBeDefined();

      // Verify configuration is properly passed
      expect(server.production).toBe(false);
      expect(server.paths.asset).toBe('/test-project/.reactus/assets');
      expect(server.routes.client).toBe('/client');
      expect(server.templates.client).toBe(CLIENT_TEMPLATE);
    });

    it('should handle minimal configuration', () => {
      const minimalConfig: ServerConfig = {
        assetPath: '/min/assets',
        basePath: '/',
        clientPath: '/min/client',
        clientRoute: '/client',
        clientTemplate: CLIENT_TEMPLATE,
        cssRoute: '/assets',
        cwd: '/min',
        documentTemplate: DOCUMENT_TEMPLATE,
        pagePath: '/min/page',
        pageTemplate: PAGE_TEMPLATE,
        plugins: [],
        production: true
      };

      const server = new Server(minimalConfig);

      expect(server.production).toBe(true);
      expect(server.paths.css).toBeUndefined();
      expect(server.routes.client).toBe('/client');
    });
  });

  describe('error handling', () => {
    it('should propagate ServerResource initialization errors', () => {
      // Temporarily override the mock implementation
      const originalImpl = MockedServerResource.getMockImplementation();
      MockedServerResource.mockImplementation(() => {
        throw new Error('ServerResource failed');
      });

      const config = makeServerConfig();

      expect(() => new Server(config)).toThrow('ServerResource failed');
      
      // Restore original implementation
      if (originalImpl) {
        MockedServerResource.mockImplementation(originalImpl);
      } else {
        MockedServerResource.mockImplementation(() => mockResource);
      }
    });

    it('should propagate ServerLoader initialization errors', () => {
      // Temporarily override the mock implementation
      const originalImpl = MockedServerLoader.getMockImplementation();
      MockedServerLoader.mockImplementation(() => {
        throw new Error('ServerLoader failed');
      });

      const config = makeServerConfig();

      expect(() => new Server(config)).toThrow('ServerLoader failed');
      
      // Restore original implementation
      if (originalImpl) {
        MockedServerLoader.mockImplementation(originalImpl);
      } else {
        MockedServerLoader.mockImplementation(() => mockLoader);
      }
    });

    it('should propagate VirtualServer initialization errors', () => {
      // Temporarily override the mock implementation
      const originalImpl = MockedVirtualServer.getMockImplementation();
      MockedVirtualServer.mockImplementation(() => {
        throw new Error('VirtualServer failed');
      });

      const config = makeServerConfig();

      expect(() => new Server(config)).toThrow('VirtualServer failed');
      
      // Restore original implementation
      if (originalImpl) {
        MockedVirtualServer.mockImplementation(originalImpl);
      } else {
        MockedVirtualServer.mockImplementation(() => mockVfs);
      }
    });
  });
});
