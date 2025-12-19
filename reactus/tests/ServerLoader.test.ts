import ServerLoader from '../src/ServerLoader.js';
import type { ServerLoaderConfig } from '../src/ServerLoader.js';
import type ServerResource from '../src/ServerResource.js';
import FileLoader from '@stackpress/lib/FileLoader';
import NodeFS from '@stackpress/lib/NodeFS';

// Mock dependencies
jest.mock('@stackpress/lib/FileLoader');
jest.mock('@stackpress/lib/NodeFS');

const MockedFileLoader = FileLoader as jest.MockedClass<typeof FileLoader>;
const MockedNodeFS = NodeFS as jest.MockedClass<typeof NodeFS>;

describe('ServerLoader', () => {
  let mockFs: jest.Mocked<NodeFS>;
  let mockFileLoader: jest.Mocked<FileLoader>;
  let mockResource: jest.Mocked<ServerResource>;
  let mockDev: any;

  const makeServerLoaderConfig = (overrides: Partial<ServerLoaderConfig> = {}): ServerLoaderConfig => ({
    production: true,
    resource: mockResource,
    ...overrides
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock NodeFS
    mockFs = new MockedNodeFS() as jest.Mocked<NodeFS>;

    // Mock FileLoader
    mockFileLoader = {
      cwd: '/project',
      fs: mockFs,
      absolute: jest.fn(),
      import: jest.fn(),
      relative: jest.fn(),
      resolveFile: jest.fn(),
      basepath: jest.fn(),
      lib: jest.fn(),
      modules: jest.fn(),
      resolve: jest.fn()
    } as unknown as jest.Mocked<FileLoader>;
    MockedFileLoader.mockImplementation(() => mockFileLoader);

    // Mock dev server
    mockDev = {
      ssrLoadModule: jest.fn()
    };

    // Mock ServerResource
    mockResource = {
      dev: jest.fn().mockResolvedValue(mockDev)
    } as any;
  });

  describe('constructor', () => {
    it('should initialize with default file system and cwd', () => {
      const config = makeServerLoaderConfig();
      const loader = new ServerLoader(config);

      expect(MockedFileLoader).toHaveBeenCalledWith(expect.any(NodeFS), process.cwd());
      expect(loader.cwd).toBe('/project');
      expect(loader.fs).toBe(mockFs);
    });

    it('should initialize with custom file system', () => {
      const customFs = new MockedNodeFS() as jest.Mocked<NodeFS>;
      const config = makeServerLoaderConfig({ fs: customFs });
      new ServerLoader(config);

      expect(MockedFileLoader).toHaveBeenCalledWith(customFs, process.cwd());
    });

    it('should initialize with custom cwd', () => {
      const config = makeServerLoaderConfig({ cwd: '/custom' });
      new ServerLoader(config);

      expect(MockedFileLoader).toHaveBeenCalledWith(expect.any(NodeFS), '/custom');
    });

    it('should initialize with production mode', () => {
      const config = makeServerLoaderConfig({ production: true });
      const loader = new ServerLoader(config);

      expect(loader['_production']).toBe(true);
    });

    it('should initialize with development mode', () => {
      const config = makeServerLoaderConfig({ production: false });
      const loader = new ServerLoader(config);

      expect(loader['_production']).toBe(false);
    });

    it('should store resource reference', () => {
      const config = makeServerLoaderConfig();
      const loader = new ServerLoader(config);

      expect(loader['_resource']).toBe(mockResource);
    });
  });

  describe('getters', () => {
    let loader: ServerLoader;

    beforeEach(() => {
      const config = makeServerLoaderConfig();
      loader = new ServerLoader(config);
    });

    it('should return cwd from file loader', () => {
      expect(loader.cwd).toBe('/project');
    });

    it('should return fs from file loader', () => {
      expect(loader.fs).toBe(mockFs);
    });
  });

  describe('absolute', () => {
    let loader: ServerLoader;

    beforeEach(() => {
      const config = makeServerLoaderConfig();
      loader = new ServerLoader(config);
    });

    it('should call file loader absolute with default pwd', async () => {
      mockFileLoader.absolute.mockResolvedValue('/project/src/pages/home.tsx');

      const result = await loader.absolute('src/pages/home.tsx');

      expect(mockFileLoader.absolute).toHaveBeenCalledWith('src/pages/home.tsx', '/project');
      expect(result).toBe('/project/src/pages/home.tsx');
    });

    it('should call file loader absolute with custom pwd', async () => {
      mockFileLoader.absolute.mockResolvedValue('/custom/src/pages/home.tsx');

      const result = await loader.absolute('src/pages/home.tsx', '/custom');

      expect(mockFileLoader.absolute).toHaveBeenCalledWith('src/pages/home.tsx', '/custom');
      expect(result).toBe('/custom/src/pages/home.tsx');
    });

    it('should handle absolute path resolution errors', async () => {
      const error = new Error('Path resolution failed');
      mockFileLoader.absolute.mockRejectedValue(error);

      await expect(loader.absolute('invalid/path')).rejects.toThrow('Path resolution failed');
    });
  });

  describe('fetch', () => {
    let loader: ServerLoader;

    beforeEach(() => {
      const config = makeServerLoaderConfig();
      loader = new ServerLoader(config);
    });

    it('should fetch module using dev server', async () => {
      const mockModule = { default: () => '<div>Test</div>' };
      mockDev.ssrLoadModule.mockResolvedValue(mockModule);

      const result = await loader.fetch('file:///project/src/pages/home.tsx');

      expect(mockResource.dev).toHaveBeenCalled();
      expect(mockDev.ssrLoadModule).toHaveBeenCalledWith('file:///project/src/pages/home.tsx');
      expect(result).toBe(mockModule);
    });

    it('should handle fetch errors', async () => {
      const error = new Error('SSR load failed');
      mockDev.ssrLoadModule.mockRejectedValue(error);

      await expect(loader.fetch('file:///invalid/path')).rejects.toThrow('SSR load failed');
    });

    it('should handle dev server initialization errors', async () => {
      const error = new Error('Dev server failed');
      mockResource.dev.mockRejectedValue(error);

      await expect(loader.fetch('file:///project/test.tsx')).rejects.toThrow('Dev server failed');
    });
  });

  describe('import', () => {
    let loader: ServerLoader;

    beforeEach(() => {
      const config = makeServerLoaderConfig();
      loader = new ServerLoader(config);
    });

    it('should use native import for production mode with .js files', async () => {
      const prodLoader = new ServerLoader(makeServerLoaderConfig({ production: true }));
      const mockModule = { default: () => '<div>Test</div>' };
      
      mockFileLoader.resolveFile.mockResolvedValue('/project/src/pages/home.js');
      mockFileLoader.basepath.mockReturnValue('/project/src/pages/home');
      mockFileLoader.import.mockResolvedValue(mockModule);

      const result = await prodLoader.import('src/pages/home');

      expect(mockFileLoader.resolveFile).toHaveBeenCalledWith(
        'src/pages/home',
        ['.js', '.tsx'],
        '/project',
        true
      );
      expect(mockFileLoader.import).toHaveBeenCalledWith('/project/src/pages/home.js');
      expect(result).toBe(mockModule);
    });

    it('should use native import for .js files in development mode', async () => {
      const devLoader = new ServerLoader(makeServerLoaderConfig({ production: false }));
      const mockModule = { default: () => '<div>Test</div>' };
      
      mockFileLoader.resolveFile.mockResolvedValue('/project/src/pages/home.js');
      mockFileLoader.basepath.mockReturnValue('/project/src/pages/home');
      mockFileLoader.import.mockResolvedValue(mockModule);

      const result = await devLoader.import('src/pages/home');

      expect(mockFileLoader.import).toHaveBeenCalledWith('/project/src/pages/home.js');
      expect(result).toBe(mockModule);
    });

    it('should use dev server for .tsx files in development mode', async () => {
      const devLoader = new ServerLoader(makeServerLoaderConfig({ production: false }));
      const mockModule = { default: () => '<div>Test</div>' };
      
      mockFileLoader.resolveFile.mockResolvedValue('/project/src/pages/home.tsx');
      mockFileLoader.basepath.mockReturnValue('/project/src/pages/home');
      mockDev.ssrLoadModule.mockResolvedValue(mockModule);

      const result = await devLoader.import('src/pages/home');

      expect(mockResource.dev).toHaveBeenCalled();
      expect(mockDev.ssrLoadModule).toHaveBeenCalledWith('file:///project/src/pages/home.tsx');
      expect(result).toBe(mockModule);
    });

    it('should use custom extnames', async () => {
      mockFileLoader.resolveFile.mockResolvedValue('/project/src/pages/home.ts');
      mockFileLoader.basepath.mockReturnValue('/project/src/pages/home');
      mockFileLoader.import.mockResolvedValue({});

      await loader.import('src/pages/home', ['.ts', '.js']);

      expect(mockFileLoader.resolveFile).toHaveBeenCalledWith(
        'src/pages/home',
        ['.ts', '.js'],
        '/project',
        true
      );
    });

    it('should handle import resolution errors', async () => {
      const error = new Error('File not found');
      mockFileLoader.resolveFile.mockRejectedValue(error);

      await expect(loader.import('invalid/path')).rejects.toThrow('File not found');
    });

    it('should handle native import errors', async () => {
      mockFileLoader.resolveFile.mockResolvedValue('/project/src/pages/home.js');
      mockFileLoader.basepath.mockReturnValue('/project/src/pages/home');
      
      const error = new Error('Import failed');
      mockFileLoader.import.mockRejectedValue(error);

      await expect(loader.import('src/pages/home')).rejects.toThrow('Import failed');
    });

    it('should handle dev server import errors', async () => {
      const devLoader = new ServerLoader(makeServerLoaderConfig({ production: false }));
      
      mockFileLoader.resolveFile.mockResolvedValue('/project/src/pages/home.tsx');
      mockFileLoader.basepath.mockReturnValue('/project/src/pages/home');
      
      const error = new Error('SSR load failed');
      mockDev.ssrLoadModule.mockRejectedValue(error);

      await expect(devLoader.import('src/pages/home')).rejects.toThrow('SSR load failed');
    });
  });

  describe('relative', () => {
    let loader: ServerLoader;

    beforeEach(() => {
      const config = makeServerLoaderConfig();
      loader = new ServerLoader(config);
    });

    it('should call file loader relative with default withExtname', () => {
      mockFileLoader.relative.mockReturnValue('./pages/home');

      const result = loader.relative('/project/src/components/Button.tsx', '/project/src/pages/home.tsx');

      expect(mockFileLoader.relative).toHaveBeenCalledWith(
        '/project/src/components/Button.tsx',
        '/project/src/pages/home.tsx',
        false
      );
      expect(result).toBe('./pages/home');
    });

    it('should call file loader relative with custom withExtname', () => {
      mockFileLoader.relative.mockReturnValue('./pages/home.tsx');

      const result = loader.relative('/project/src/components/Button.tsx', '/project/src/pages/home.tsx', true);

      expect(mockFileLoader.relative).toHaveBeenCalledWith(
        '/project/src/components/Button.tsx',
        '/project/src/pages/home.tsx',
        true
      );
      expect(result).toBe('./pages/home.tsx');
    });
  });

  describe('resolveFile', () => {
    let loader: ServerLoader;

    beforeEach(() => {
      const config = makeServerLoaderConfig();
      loader = new ServerLoader(config);
    });

    it('should call file loader resolveFile with default parameters', () => {
      mockFileLoader.resolveFile.mockResolvedValue('/project/src/pages/home.js');

      const result = loader.resolveFile('src/pages/home');

      expect(mockFileLoader.resolveFile).toHaveBeenCalledWith(
        'src/pages/home',
        ['.js', '.json'],
        '/project',
        false
      );
      expect(result).resolves.toBe('/project/src/pages/home.js');
    });

    it('should call file loader resolveFile with custom parameters', () => {
      mockFileLoader.resolveFile.mockResolvedValue('/custom/src/pages/home.tsx');

      const result = loader.resolveFile('src/pages/home', ['.tsx', '.ts'], '/custom', true);

      expect(mockFileLoader.resolveFile).toHaveBeenCalledWith(
        'src/pages/home',
        ['.tsx', '.ts'],
        '/custom',
        true
      );
      expect(result).resolves.toBe('/custom/src/pages/home.tsx');
    });
  });

  describe('resolve', () => {
    let loader: ServerLoader;

    beforeEach(() => {
      const config = makeServerLoaderConfig();
      loader = new ServerLoader(config);
    });

    it('should resolve file and return metadata', async () => {
      mockFileLoader.resolveFile.mockResolvedValue('/project/src/pages/home.tsx');
      mockFileLoader.basepath.mockReturnValue('/project/src/pages/home');

      const result = await loader.resolve('src/pages/home');

      expect(mockFileLoader.resolveFile).toHaveBeenCalledWith(
        'src/pages/home',
        ['.js', '.tsx'],
        '/project',
        true
      );
      expect(mockFileLoader.basepath).toHaveBeenCalledWith('/project/src/pages/home.tsx');
      expect(result).toEqual({
        filepath: '/project/src/pages/home.tsx',
        basepath: '/project/src/pages/home',
        extname: '.tsx'
      });
    });

    it('should resolve file with custom extnames', async () => {
      mockFileLoader.resolveFile.mockResolvedValue('/project/src/pages/home.ts');
      mockFileLoader.basepath.mockReturnValue('/project/src/pages/home');

      const result = await loader.resolve('src/pages/home', ['.ts', '.js']);

      expect(mockFileLoader.resolveFile).toHaveBeenCalledWith(
        'src/pages/home',
        ['.ts', '.js'],
        '/project',
        true
      );
      expect(result).toEqual({
        filepath: '/project/src/pages/home.ts',
        basepath: '/project/src/pages/home',
        extname: '.ts'
      });
    });

    it('should handle resolve errors when file not found', async () => {
      const error = new Error('File not found');
      mockFileLoader.resolveFile.mockRejectedValue(error);

      await expect(loader.resolve('invalid/path')).rejects.toThrow('File not found');
    });

    it('should handle different file extensions', async () => {
      mockFileLoader.resolveFile.mockResolvedValue('/project/src/pages/home.js');
      mockFileLoader.basepath.mockReturnValue('/project/src/pages/home');

      const result = await loader.resolve('src/pages/home');

      expect(result.extname).toBe('.js');
    });
  });

  describe('integration', () => {
    it('should work with production and development modes', async () => {
      // Production mode
      const prodConfig = makeServerLoaderConfig({ production: true });
      const prodLoader = new ServerLoader(prodConfig);

      mockFileLoader.resolveFile.mockResolvedValue('/project/dist/home.js');
      mockFileLoader.basepath.mockReturnValue('/project/dist/home');
      mockFileLoader.import.mockResolvedValue({ default: 'prod-component' });

      const prodResult = await prodLoader.import('dist/home');
      expect(prodResult).toEqual({ default: 'prod-component' });

      // Development mode
      const devConfig = makeServerLoaderConfig({ production: false });
      const devLoader = new ServerLoader(devConfig);

      mockFileLoader.resolveFile.mockResolvedValue('/project/src/home.tsx');
      mockFileLoader.basepath.mockReturnValue('/project/src/home');
      mockDev.ssrLoadModule.mockResolvedValue({ default: 'dev-component' });

      const devResult = await devLoader.import('src/home');
      expect(devResult).toEqual({ default: 'dev-component' });
    });

    it('should handle complex file resolution scenarios', async () => {
      const config = makeServerLoaderConfig();
      const loader = new ServerLoader(config);

      // Test absolute path resolution
      mockFileLoader.absolute.mockResolvedValue('/project/src/components/Button.tsx');
      const absolutePath = await loader.absolute('@/components/Button');
      expect(absolutePath).toBe('/project/src/components/Button.tsx');

      // Test relative path calculation
      mockFileLoader.relative.mockReturnValue('../components/Button');
      const relativePath = loader.relative('/project/src/pages/home.tsx', '/project/src/components/Button.tsx');
      expect(relativePath).toBe('../components/Button');

      // Test file resolution with metadata
      mockFileLoader.resolveFile.mockResolvedValue('/project/src/components/Button.tsx');
      mockFileLoader.basepath.mockReturnValue('/project/src/components/Button');
      const resolved = await loader.resolve('src/components/Button');
      expect(resolved.extname).toBe('.tsx');
    });
  });

  describe('error handling', () => {
    let loader: ServerLoader;

    beforeEach(() => {
      const config = makeServerLoaderConfig();
      loader = new ServerLoader(config);
    });

    it('should propagate file loader errors', async () => {
      const error = new Error('FileLoader error');
      mockFileLoader.absolute.mockRejectedValue(error);

      await expect(loader.absolute('test')).rejects.toThrow('FileLoader error');
    });

    it('should propagate resource errors', async () => {
      const error = new Error('Resource error');
      mockResource.dev.mockRejectedValue(error);

      await expect(loader.fetch('file:///test')).rejects.toThrow('Resource error');
    });

    it('should handle missing files gracefully in resolveFile', async () => {
      mockFileLoader.resolveFile.mockResolvedValue(null);

      const result = await loader.resolveFile('nonexistent');
      expect(result).toBeNull();
    });
  });
});
