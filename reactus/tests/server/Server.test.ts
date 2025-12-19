import Server from '../../src/server/Server.js';
import FileLoader from '@stackpress/lib/FileLoader';
import type { ServerConfig } from '../../src/server/types.js';

// Mock dependencies
jest.mock('@stackpress/lib/FileLoader');

const MockedFileLoader = FileLoader as jest.MockedClass<typeof FileLoader>;

describe('server/Server', () => {
  let mockConfig: ServerConfig;
  let mockFileLoader: jest.Mocked<FileLoader>;
  let server: Server;

  beforeEach(() => {
    mockFileLoader = {
      cwd: '/test/project',
      fs: {} as any,
      basepath: jest.fn(),
      resolveFile: jest.fn(),
      import: jest.fn()
    } as unknown as jest.Mocked<FileLoader>;

    MockedFileLoader.mockImplementation(() => mockFileLoader);

    mockConfig = {
      clientRoute: '/client',
      cssRoute: '/assets',
      cwd: '/test/project',
      documentTemplate: '<html><!--document-head--><!--document-body--><!--document-props--><!--document-client--></html>',
      fs: {} as any,
      pagePath: '/test/project/.reactus/page'
    };

    server = new Server(mockConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('initializes FileLoader with correct parameters', () => {
      expect(MockedFileLoader).toHaveBeenCalledWith(mockConfig.fs, mockConfig.cwd);
    });

    it('sets up routes correctly', () => {
      expect(server.routes).toEqual({
        client: '/client',
        css: '/assets'
      });
    });

    it('sets up paths correctly', () => {
      expect(server.paths).toEqual({
        page: '/test/project/.reactus/page'
      });
    });

    it('sets up templates correctly', () => {
      expect(server.templates).toEqual({
        document: '<html><!--document-head--><!--document-body--><!--document-props--><!--document-client--></html>'
      });
    });

    it('uses default cwd when not provided', () => {
      const configWithoutCwd = { ...mockConfig };
      delete (configWithoutCwd as any).cwd;

      new Server(configWithoutCwd);

      expect(MockedFileLoader).toHaveBeenCalledWith(mockConfig.fs, process.cwd());
    });
  });

  describe('getters', () => {
    describe('cwd', () => {
      it('returns loader cwd', () => {
        expect(server.cwd).toBe('/test/project');
      });
    });

    describe('fs', () => {
      it('returns loader fs', () => {
        expect(server.fs).toBe(mockFileLoader.fs);
      });
    });

    describe('paths', () => {
      it('returns frozen paths object', () => {
        const paths = server.paths;
        
        expect(Object.isFrozen(paths)).toBe(true);
        expect(() => {
          (paths as any).page = '/modified';
        }).toThrow();
      });

      it('returns correct paths structure', () => {
        expect(server.paths).toEqual({
          page: '/test/project/.reactus/page'
        });
      });
    });

    describe('routes', () => {
      it('returns frozen routes object', () => {
        const routes = server.routes;
        
        expect(Object.isFrozen(routes)).toBe(true);
        expect(() => {
          (routes as any).client = '/modified';
        }).toThrow();
      });

      it('returns correct routes structure', () => {
        expect(server.routes).toEqual({
          client: '/client',
          css: '/assets'
        });
      });
    });

    describe('templates', () => {
      it('returns frozen templates object', () => {
        const templates = server.templates;
        
        expect(Object.isFrozen(templates)).toBe(true);
        expect(() => {
          (templates as any).document = 'modified';
        }).toThrow();
      });

      it('returns correct templates structure', () => {
        expect(server.templates).toEqual({
          document: '<html><!--document-head--><!--document-body--><!--document-props--><!--document-client--></html>'
        });
      });
    });
  });

  describe('import()', () => {
    it('resolves and imports file with default extensions', async () => {
      const mockImport = { default: 'component', styles: ['style.css'] };
      
      mockFileLoader.resolveFile.mockResolvedValue('/resolved/path/component.js');
      mockFileLoader.import.mockResolvedValue(mockImport);

      const result = await server.import('/test/component');

      expect(mockFileLoader.resolveFile).toHaveBeenCalledWith(
        '/test/component',
        ['.js'],
        '/test/project',
        true
      );
      expect(mockFileLoader.import).toHaveBeenCalledWith('/resolved/path/component.js');
      expect(result).toBe(mockImport);
    });

    it('uses custom extensions when provided', async () => {
      const mockImport = { default: 'component' };
      
      mockFileLoader.resolveFile.mockResolvedValue('/resolved/path/component.tsx');
      mockFileLoader.import.mockResolvedValue(mockImport);

      await server.import('/test/component', ['.tsx', '.ts']);

      expect(mockFileLoader.resolveFile).toHaveBeenCalledWith(
        '/test/component',
        ['.tsx', '.ts'],
        '/test/project',
        true
      );
    });

    it('throws error when file cannot be resolved', async () => {
      mockFileLoader.resolveFile.mockRejectedValue(new Error('File not found'));

      await expect(server.import('/non-existent')).rejects.toThrow('File not found');
    });

    it('throws error when import fails', async () => {
      mockFileLoader.resolveFile.mockResolvedValue('/resolved/path/component.js');
      mockFileLoader.import.mockRejectedValue(new Error('Import failed'));

      await expect(server.import('/test/component')).rejects.toThrow('Import failed');
    });

    it('returns typed import result', async () => {
      interface TestImport {
        default: string;
        named: number;
      }

      const mockImport: TestImport = { default: 'test', named: 42 };
      
      mockFileLoader.resolveFile.mockResolvedValue('/resolved/path/component.js');
      mockFileLoader.import.mockResolvedValue(mockImport);

      const result = await server.import<TestImport>('/test/component');

      expect(result.default).toBe('test');
      expect(result.named).toBe(42);
    });
  });

  describe('resolve()', () => {
    beforeEach(() => {
      mockFileLoader.basepath.mockImplementation((filepath: string) => 
        filepath.replace(/\.[^/.]+$/, '')
      );
    });

    it('resolves file and returns metadata with default extensions', async () => {
      mockFileLoader.resolveFile.mockResolvedValue('/resolved/path/component.js');

      const result = await server.resolve('/test/component');

      expect(mockFileLoader.resolveFile).toHaveBeenCalledWith(
        '/test/component',
        ['.js'],
        '/test/project',
        true
      );
      expect(mockFileLoader.basepath).toHaveBeenCalledWith('/resolved/path/component.js');
      expect(result).toEqual({
        filepath: '/resolved/path/component.js',
        basepath: '/resolved/path/component',
        extname: '.js'
      });
    });

    it('uses custom extensions when provided', async () => {
      mockFileLoader.resolveFile.mockResolvedValue('/resolved/path/component.tsx');

      const result = await server.resolve('/test/component', ['.tsx', '.ts']);

      expect(mockFileLoader.resolveFile).toHaveBeenCalledWith(
        '/test/component',
        ['.tsx', '.ts'],
        '/test/project',
        true
      );
      expect(result).toEqual({
        filepath: '/resolved/path/component.tsx',
        basepath: '/resolved/path/component',
        extname: '.tsx'
      });
    });

    it('handles files without extensions', async () => {
      mockFileLoader.resolveFile.mockResolvedValue('/resolved/path/component');
      mockFileLoader.basepath.mockReturnValue('/resolved/path/component');

      const result = await server.resolve('/test/component');

      expect(result).toEqual({
        filepath: '/resolved/path/component',
        basepath: '/resolved/path/component',
        extname: ''
      });
    });

    it('throws error when file cannot be resolved', async () => {
      mockFileLoader.resolveFile.mockRejectedValue(new Error('File not found'));

      await expect(server.resolve('/non-existent')).rejects.toThrow('File not found');
    });

    it('handles complex file paths', async () => {
      mockFileLoader.resolveFile.mockResolvedValue('/project/src/components/ui/Button.component.tsx');

      const result = await server.resolve('@/components/ui/Button.component');

      expect(result).toEqual({
        filepath: '/project/src/components/ui/Button.component.tsx',
        basepath: '/project/src/components/ui/Button.component',
        extname: '.tsx'
      });
    });

    it('handles multiple extensions correctly', async () => {
      const testCases = [
        { filepath: '/test/file.js', extname: '.js' },
        { filepath: '/test/file.tsx', extname: '.tsx' },
        { filepath: '/test/file.component.ts', extname: '.ts' },
        { filepath: '/test/file.d.ts', extname: '.ts' }
      ];

      for (const testCase of testCases) {
        mockFileLoader.resolveFile.mockResolvedValue(testCase.filepath);
        
        const result = await server.resolve('/test/file');
        
        expect(result.extname).toBe(testCase.extname);
      }
    });
  });

  describe('integration scenarios', () => {
    it('import and resolve work together', async () => {
      const mockImport = { default: 'component', styles: ['style.css'] };
      
      mockFileLoader.resolveFile.mockResolvedValue('/resolved/path/component.js');
      mockFileLoader.import.mockResolvedValue(mockImport);

      // First resolve the file
      const resolved = await server.resolve('/test/component');
      
      // Then import using the resolved path
      const imported = await server.import(resolved.basepath);

      expect(resolved.filepath).toBe('/resolved/path/component.js');
      expect(imported).toBe(mockImport);
    });

    it('handles different server configurations', () => {
      const customConfig: ServerConfig = {
        clientRoute: '/scripts',
        cssRoute: '/styles',
        cwd: '/custom/project',
        documentTemplate: '<html>Custom Template</html>',
        fs: {} as any,
        pagePath: '/custom/build/pages'
      };

      const customServer = new Server(customConfig);

      expect(customServer.routes).toEqual({
        client: '/scripts',
        css: '/styles'
      });
      expect(customServer.paths).toEqual({
        page: '/custom/build/pages'
      });
      expect(customServer.templates).toEqual({
        document: '<html>Custom Template</html>'
      });
    });

    it('maintains immutability of configuration objects', () => {
      const routes = server.routes;
      const paths = server.paths;
      const templates = server.templates;

      // All should be frozen
      expect(Object.isFrozen(routes)).toBe(true);
      expect(Object.isFrozen(paths)).toBe(true);
      expect(Object.isFrozen(templates)).toBe(true);

      // Attempting to modify should throw
      expect(() => {
        (routes as any).newRoute = '/new';
      }).toThrow();
      expect(() => {
        (paths as any).newPath = '/new';
      }).toThrow();
      expect(() => {
        (templates as any).newTemplate = 'new';
      }).toThrow();
    });

    it('handles file resolution with various path formats', async () => {
      const pathFormats = [
        '/absolute/path/component',
        './relative/path/component',
        '../parent/path/component',
        '@/project/root/component',
        'node_modules/package/component'
      ];

      for (const pathname of pathFormats) {
        mockFileLoader.resolveFile.mockResolvedValue(`/resolved${pathname}.js`);
        
        const result = await server.resolve(pathname);
        
        expect(result.filepath).toBe(`/resolved${pathname}.js`);
        expect(mockFileLoader.resolveFile).toHaveBeenCalledWith(
          pathname,
          ['.js'],
          '/test/project',
          true
        );
      }
    });

    it('preserves loader configuration across operations', () => {
      // Multiple operations should use the same loader instance
      expect(server.cwd).toBe('/test/project');
      expect(server.fs).toBe(mockFileLoader.fs);
      
      // Loader should be the same instance
      expect(server.loader).toBe(mockFileLoader);
    });
  });
});
