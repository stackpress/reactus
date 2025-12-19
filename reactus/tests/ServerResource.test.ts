import ServerResource from '../src/ServerResource.js';
import type { ResourceConfig } from '../src/ServerResource.js';
import Server from '../src/Server.js';
import { css, file, hmr, vfs } from '../src/plugins.js';

// Mock dependencies
jest.mock('../src/Server.js');
jest.mock('../src/plugins.js');
jest.mock('vite', () => ({
  build: jest.fn(),
  createServer: jest.fn()
}));
jest.mock('@vitejs/plugin-react', () => jest.fn(() => ({ name: 'react' })));

const mockCss = css as jest.MockedFunction<typeof css>;
const mockFile = file as jest.MockedFunction<typeof file>;
const mockHmr = hmr as jest.MockedFunction<typeof hmr>;
const mockVfsPlugin = vfs as jest.MockedFunction<typeof vfs>;

// Mock vite functions
const mockBuild = jest.fn();
const mockCreateServer = jest.fn();

// Mock vite module
jest.mock('vite', () => ({
  build: mockBuild,
  createServer: mockCreateServer
}));

describe('ServerResource', () => {
  let mockServer: jest.Mocked<Server>;
  let mockVfs: any;
  let mockLoader: any;
  let mockPaths: any;
  let resource: ServerResource;
  let config: ResourceConfig;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock VFS
    mockVfs = {
      read: jest.fn(),
      write: jest.fn()
    };

    // Mock loader
    mockLoader = {
      cwd: '/project',
      absolute: jest.fn(),
      relative: jest.fn()
    };

    // Mock paths
    mockPaths = {
      css: '/project/styles.css',
      build: '/project/build',
      public: '/project/public'
    };

    // Mock server
    mockServer = {
      vfs: mockVfs,
      loader: mockLoader,
      paths: mockPaths
    } as unknown as jest.Mocked<Server>;

    // Default config
    config = {
      basePath: '/app',
      cwd: '/project',
      plugins: [{ name: 'test-plugin' }],
      watchIgnore: ['node_modules/**'],
      optimizeDeps: {
        include: ['react', 'react-dom']
      }
    };

    resource = new ServerResource(mockServer, config);
  });

  describe('constructor', () => {
    it('should initialize with server and config', () => {
      expect(resource['_server']).toBe(mockServer);
      expect(resource['_cwd']).toBe('/project');
      expect(resource.base).toBe('/app');
      expect(resource['_ignore']).toEqual(['node_modules/**']);
      expect(resource['_optimize']).toEqual({
        include: ['react', 'react-dom']
      });
      expect(resource['_plugins']).toEqual([{ name: 'test-plugin' }]);
    });

    it('should use default values when not provided', () => {
      const minimalConfig: ResourceConfig = {
        basePath: '',
        cwd: '/project',
        plugins: []
      };

      const minimalResource = new ServerResource(mockServer, minimalConfig);

      expect(minimalResource.base).toBe('/');
      expect(minimalResource['_ignore']).toEqual([]);
      expect(minimalResource['_optimize']).toBeUndefined();
      expect(minimalResource['_plugins']).toEqual([]);
    });

    it('should store vite config when provided', () => {
      const viteConfig = {
        mode: 'production',
        build: { outDir: 'dist' }
      };

      const configWithVite: ResourceConfig = {
        ...config,
        config: viteConfig
      };

      const resourceWithVite = new ServerResource(mockServer, configWithVite);

      expect(resourceWithVite['_config']).toEqual(viteConfig);
    });
  });

  describe('config getter', () => {
    it('should return frozen config when available', () => {
      const viteConfig = {
        mode: 'production',
        build: { outDir: 'dist' }
      };

      const configWithVite: ResourceConfig = {
        ...config,
        config: viteConfig
      };

      const resourceWithVite = new ServerResource(mockServer, configWithVite);
      const result = resourceWithVite.config;

      expect(result).toEqual(viteConfig);
      expect(Object.isFrozen(result)).toBe(true);
    });

    it('should return null when no config is set', () => {
      expect(resource.config).toBeNull();
    });
  });

  describe('build', () => {
    it('should call vite build with merged config', async () => {
      const buildConfig = {
        mode: 'production',
        outDir: 'dist'
      };

      // Mock plugins
      mockCss.mockReturnValue({ name: 'css' } as any);
      mockVfsPlugin.mockReturnValue({ name: 'vfs' } as any);
      mockFile.mockReturnValue({ name: 'file' } as any);

      const mockReactPlugin = { name: 'react' } as any;
      (require('@vitejs/plugin-react') as jest.MockedFunction<any>).mockReturnValue(mockReactPlugin);

      mockBuild.mockResolvedValue({ success: true });

      const result = await resource.build(buildConfig);

      expect(mockBuild).toHaveBeenCalledWith({
        logLevel: 'silent',
        mode: 'production',
        outDir: 'dist',
        plugins: [
          { name: 'css' },
          { name: 'vfs' },
          { name: 'file' },
          mockReactPlugin,
          { name: 'test-plugin' }
        ]
      });
      expect(result).toEqual({ success: true });
    });

    it('should handle build errors', async () => {
      const buildError = new Error('Build failed');
      mockBuild.mockRejectedValue(buildError);

      await expect(resource.build({})).rejects.toThrow('Build failed');
    });
  });

  describe('dev', () => {
    let mockDevServer: any;

    beforeEach(() => {
      mockDevServer = {
        middlewares: {
          use: jest.fn()
        }
      };
      mockCreateServer.mockResolvedValue(mockDevServer);
    });

    it('should create and cache dev server', async () => {
      // Mock plugins
      mockCss.mockReturnValue({ name: 'css' } as any);
      mockVfsPlugin.mockReturnValue({ name: 'vfs' } as any);
      mockFile.mockReturnValue({ name: 'file' } as any);
      mockHmr.mockReturnValue({ name: 'hmr' } as any);

      const mockReactPlugin = { name: 'react' } as any;
      (require('@vitejs/plugin-react') as jest.MockedFunction<any>).mockReturnValue(mockReactPlugin);

      const result = await resource.dev();

      expect(mockCreateServer).toHaveBeenCalledWith({
        server: {
          middlewareMode: true,
          watch: { ignored: ['node_modules/**'] }
        },
        appType: 'custom',
        base: '/app',
        root: '/project',
        mode: 'development',
        optimizeDeps: {
          include: ['react', 'react-dom']
        },
        plugins: [
          { name: 'css' },
          { name: 'vfs' },
          { name: 'file' },
          mockReactPlugin,
          { name: 'test-plugin' }
        ]
      });

      expect(mockDevServer.middlewares.use).toHaveBeenCalledWith({ name: 'hmr' });
      expect(result).toBe(mockDevServer);
    });

    it('should return cached dev server on subsequent calls', async () => {
      // Mock plugins
      mockCss.mockReturnValue({ name: 'css' } as any);
      mockVfsPlugin.mockReturnValue({ name: 'vfs' } as any);
      mockFile.mockReturnValue({ name: 'file' } as any);
      mockHmr.mockReturnValue({ name: 'hmr' } as any);

      const mockReactPlugin = { name: 'react' } as any;
      (require('@vitejs/plugin-react') as jest.MockedFunction<any>).mockReturnValue(mockReactPlugin);

      const result1 = await resource.dev();
      const result2 = await resource.dev();

      expect(mockCreateServer).toHaveBeenCalledTimes(1);
      expect(result1).toBe(result2);
    });

    it('should handle dev server creation errors', async () => {
      const serverError = new Error('Server creation failed');
      mockCreateServer.mockRejectedValue(serverError);

      await expect(resource.dev()).rejects.toThrow('Server creation failed');
    });
  });

  describe('middlewares', () => {
    it('should return dev server middlewares', async () => {
      const mockMiddlewares = { use: jest.fn() };
      const mockDevServer = {
        middlewares: mockMiddlewares
      };

      mockCreateServer.mockResolvedValue(mockDevServer);

      // Mock plugins
      mockCss.mockReturnValue({ name: 'css' } as any);
      mockVfsPlugin.mockReturnValue({ name: 'vfs' } as any);
      mockFile.mockReturnValue({ name: 'file' } as any);
      mockHmr.mockReturnValue({ name: 'hmr' } as any);

      const result = await resource.middlewares();

      expect(result).toBe(mockMiddlewares);
    });
  });

  describe('plugins', () => {
    it('should return plugins with CSS when CSS path exists', async () => {
      mockCss.mockReturnValue({ name: 'css' } as any);
      mockVfsPlugin.mockReturnValue({ name: 'vfs' } as any);
      mockFile.mockReturnValue({ name: 'file' } as any);

      const mockReactPlugin = { name: 'react' } as any;
      (require('@vitejs/plugin-react') as jest.MockedFunction<any>).mockReturnValue(mockReactPlugin);

      const result = await resource.plugins();

      expect(mockCss).toHaveBeenCalledWith('/project/styles.css');
      expect(mockVfsPlugin).toHaveBeenCalledWith(mockVfs);
      expect(mockFile).toHaveBeenCalledWith(mockLoader);
      expect(result).toEqual([
        { name: 'css' },
        { name: 'vfs' },
        { name: 'file' },
        mockReactPlugin,
        { name: 'test-plugin' }
      ]);
    });

    it('should return plugins without CSS when CSS path does not exist', async () => {
      // Mock server without CSS path
      const serverWithoutCSS = {
        ...mockServer,
        paths: {
          ...mockPaths,
          css: null
        }
      } as unknown as jest.Mocked<Server>;

      const resourceWithoutCSS = new ServerResource(serverWithoutCSS, config);

      mockVfsPlugin.mockReturnValue({ name: 'vfs' } as any);
      mockFile.mockReturnValue({ name: 'file' } as any);

      const mockReactPlugin = { name: 'react' } as any;
      (require('@vitejs/plugin-react') as jest.MockedFunction<any>).mockReturnValue(mockReactPlugin);

      const result = await resourceWithoutCSS.plugins();

      expect(mockCss).not.toHaveBeenCalled();
      expect(result).toEqual([
        null,
        { name: 'vfs' },
        { name: 'file' },
        mockReactPlugin,
        { name: 'test-plugin' }
      ]);
    });

    it('should handle plugin creation errors', async () => {
      const pluginError = new Error('Plugin creation failed');
      mockVfsPlugin.mockImplementation(() => {
        throw pluginError;
      });

      await expect(resource.plugins()).rejects.toThrow('Plugin creation failed');
    });
  });

  describe('_createServer', () => {
    it('should create vite server with correct configuration', async () => {
      const mockDevServer = {
        middlewares: { use: jest.fn() }
      };
      mockCreateServer.mockResolvedValue(mockDevServer);

      // Mock plugins
      mockCss.mockReturnValue({ name: 'css' } as any);
      mockVfsPlugin.mockReturnValue({ name: 'vfs' } as any);
      mockFile.mockReturnValue({ name: 'file' } as any);

      const mockReactPlugin = { name: 'react' } as any;
      (require('@vitejs/plugin-react') as jest.MockedFunction<any>).mockReturnValue(mockReactPlugin);

      const result = await resource['_createServer']();

      expect(mockCreateServer).toHaveBeenCalledWith({
        server: {
          middlewareMode: true,
          watch: { ignored: ['node_modules/**'] }
        },
        appType: 'custom',
        base: '/app',
        root: '/project',
        mode: 'development',
        optimizeDeps: {
          include: ['react', 'react-dom']
        },
        plugins: [
          { name: 'css' },
          { name: 'vfs' },
          { name: 'file' },
          mockReactPlugin,
          { name: 'test-plugin' }
        ]
      });
      expect(result).toBe(mockDevServer);
    });

    it('should merge custom vite config', async () => {
      const customConfig: ResourceConfig = {
        ...config,
        config: {
          mode: 'test',
          define: { __TEST__: true }
        }
      };

      const resourceWithCustomConfig = new ServerResource(mockServer, customConfig);

      const mockDevServer = {
        middlewares: { use: jest.fn() }
      };
      mockCreateServer.mockResolvedValue(mockDevServer);

      // Mock plugins
      mockCss.mockReturnValue({ name: 'css' } as any);
      mockVfsPlugin.mockReturnValue({ name: 'vfs' } as any);
      mockFile.mockReturnValue({ name: 'file' } as any);

      const mockReactPlugin = { name: 'react' } as any;
      (require('@vitejs/plugin-react') as jest.MockedFunction<any>).mockReturnValue(mockReactPlugin);

      await resourceWithCustomConfig['_createServer']();

      expect(mockCreateServer).toHaveBeenCalledWith({
        server: {
          middlewareMode: true,
          watch: { ignored: ['node_modules/**'] }
        },
        appType: 'custom',
        base: '/app',
        root: '/project',
        mode: 'test',
        optimizeDeps: {
          include: ['react', 'react-dom']
        },
        define: { __TEST__: true },
        plugins: [
          { name: 'css' },
          { name: 'vfs' },
          { name: 'file' },
          mockReactPlugin,
          { name: 'test-plugin' }
        ]
      });
    });
  });

  describe('integration', () => {
    it('should handle complete development workflow', async () => {
      const mockDevServer = {
        middlewares: { use: jest.fn() }
      };
      mockCreateServer.mockResolvedValue(mockDevServer);

      // Mock plugins
      mockCss.mockReturnValue({ name: 'css' } as any);
      mockVfsPlugin.mockReturnValue({ name: 'vfs' } as any);
      mockFile.mockReturnValue({ name: 'file' } as any);
      mockHmr.mockReturnValue({ name: 'hmr' } as any);

      const mockReactPlugin = { name: 'react' } as any;
      (require('@vitejs/plugin-react') as jest.MockedFunction<any>).mockReturnValue(mockReactPlugin);

      // Get plugins
      const plugins = await resource.plugins();
      expect(plugins).toHaveLength(5);

      // Start dev server
      const devServer = await resource.dev();
      expect(devServer).toBe(mockDevServer);

      // Get middlewares
      const middlewares = await resource.middlewares();
      expect(middlewares).toBe(mockDevServer.middlewares);

      // Verify HMR middleware was added
      expect(mockDevServer.middlewares.use).toHaveBeenCalledWith({ name: 'hmr' });
    });

    it('should handle build workflow', async () => {
      mockBuild.mockResolvedValue({ success: true });

      // Mock plugins
      mockCss.mockReturnValue({ name: 'css' } as any);
      mockVfsPlugin.mockReturnValue({ name: 'vfs' } as any);
      mockFile.mockReturnValue({ name: 'file' } as any);

      const mockReactPlugin = { name: 'react' } as any;
      (require('@vitejs/plugin-react') as jest.MockedFunction<any>).mockReturnValue(mockReactPlugin);

      const buildResult = await resource.build({
        mode: 'production',
        build: { outDir: 'dist' }
      });

      expect(buildResult).toEqual({ success: true });
      expect(mockBuild).toHaveBeenCalledWith({
        logLevel: 'silent',
        mode: 'production',
        build: { outDir: 'dist' },
        plugins: [
          { name: 'css' },
          { name: 'vfs' },
          { name: 'file' },
          mockReactPlugin,
          { name: 'test-plugin' }
        ]
      });
    });
  });

  describe('error handling', () => {
    it('should handle vite import errors', async () => {
      // Mock vite build to throw an error
      mockBuild.mockRejectedValue(new Error('Vite import failed'));

      await expect(resource.build({})).rejects.toThrow('Vite import failed');
    });

    it('should handle react plugin import errors', async () => {
      // Mock react plugin to throw an error when called
      const mockReactPlugin = jest.fn(() => {
        throw new Error('React plugin import failed');
      });
      (require('@vitejs/plugin-react') as jest.MockedFunction<any>).mockImplementation(mockReactPlugin);

      await expect(resource.plugins()).rejects.toThrow('React plugin import failed');
    });
  });
});
