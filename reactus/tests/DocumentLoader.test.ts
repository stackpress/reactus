import DocumentLoader from '../src/DocumentLoader.js';
import type Document from '../src/Document.js';
import type Server from '../src/Server.js';
import type { DocumentImport } from '../src/types.js';

describe('DocumentLoader', () => {
  let mockDocument: Document;
  let mockServer: Server;
  let mockServerLoader: any;
  let loader: DocumentLoader;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock server loader
    mockServerLoader = {
      absolute: jest.fn(),
      import: jest.fn(),
      fetch: jest.fn(),
      resolve: jest.fn(),
      relative: jest.fn()
    };

    // Mock server
    mockServer = {
      loader: mockServerLoader,
      production: false,
      paths: {
        page: '/build/pages'
      }
    } as unknown as Server;

    // Mock document
    mockDocument = {
      entry: '@/pages/home.tsx',
      id: 'home.tsx-abc123',
      server: mockServer
    } as unknown as Document;

    loader = new DocumentLoader(mockDocument);
  });

  describe('constructor', () => {
    it('should initialize with document and server references', () => {
      expect(loader['_document']).toBe(mockDocument);
      expect(loader['_server']).toBe(mockServer);
    });
  });

  describe('absolute', () => {
    it('should return absolute path from server loader', async () => {
      const expectedPath = '/project/src/pages/home.tsx';
      mockServerLoader.absolute.mockResolvedValue(expectedPath);

      const result = await loader.absolute();

      expect(mockServerLoader.absolute).toHaveBeenCalledWith('@/pages/home.tsx');
      expect(result).toBe(expectedPath);
    });

    it('should handle module paths', async () => {
      const moduleDocument = {
        entry: 'react-components/Button.tsx',
        id: 'Button.tsx-def456',
        server: mockServer
      } as unknown as Document;
      const moduleLoader = new DocumentLoader(moduleDocument);
      
      const expectedPath = '/project/node_modules/react-components/Button.tsx';
      mockServerLoader.absolute.mockResolvedValue(expectedPath);

      const result = await moduleLoader.absolute();

      expect(mockServerLoader.absolute).toHaveBeenCalledWith('react-components/Button.tsx');
      expect(result).toBe(expectedPath);
    });
  });

  describe('import', () => {
    const mockDocumentImport: DocumentImport = {
      default: () => 'Test Component',
      Head: () => 'Test Head',
      styles: ['style1.css', 'style2.css']
    };

    describe('in production mode', () => {
      it('should import from built page file', async () => {
        const prodServer = {
          ...mockServer,
          production: true
        } as unknown as Server;
        const prodDocument = {
          ...mockDocument,
          server: prodServer
        } as unknown as Document;
        const prodLoader = new DocumentLoader(prodDocument);
        
        mockServerLoader.import.mockResolvedValue(mockDocumentImport);

        const result = await prodLoader.import();

        expect(mockServerLoader.import).toHaveBeenCalledWith('/build/pages/home.tsx-abc123.js');
        expect(result).toBe(mockDocumentImport);
      });

      it('should handle different document IDs', async () => {
        const prodServer = {
          ...mockServer,
          production: true
        } as unknown as Server;
        const aboutDocument = {
          entry: '@/pages/about.tsx',
          id: 'about.tsx-def456',
          server: prodServer
        } as unknown as Document;
        const aboutLoader = new DocumentLoader(aboutDocument);
        
        mockServerLoader.import.mockResolvedValue(mockDocumentImport);

        await aboutLoader.import();

        expect(mockServerLoader.import).toHaveBeenCalledWith('/build/pages/about.tsx-def456.js');
      });
    });

    describe('in development mode', () => {
      it('should fetch from dev server using file URL', async () => {
        const devServer = {
          ...mockServer,
          production: false
        } as unknown as Server;
        const devDocument = {
          ...mockDocument,
          server: devServer
        } as unknown as Document;
        const devLoader = new DocumentLoader(devDocument);
        
        mockServerLoader.resolve.mockResolvedValue({
          filepath: '/project/src/pages/home.tsx'
        });
        mockServerLoader.fetch.mockResolvedValue(mockDocumentImport);

        const result = await devLoader.import();

        expect(mockServerLoader.resolve).toHaveBeenCalledWith('@/pages/home.tsx');
        expect(mockServerLoader.fetch).toHaveBeenCalledWith('file:///project/src/pages/home.tsx');
        expect(result).toBe(mockDocumentImport);
      });

      it('should handle different entry paths', async () => {
        const devServer = {
          ...mockServer,
          production: false
        } as unknown as Server;
        const layoutDocument = {
          entry: '@/components/Layout.tsx',
          id: 'Layout.tsx-ghi789',
          server: devServer
        } as unknown as Document;
        const layoutLoader = new DocumentLoader(layoutDocument);
        
        mockServerLoader.resolve.mockResolvedValue({
          filepath: '/project/src/components/Layout.tsx'
        });
        mockServerLoader.fetch.mockResolvedValue(mockDocumentImport);

        await layoutLoader.import();

        expect(mockServerLoader.resolve).toHaveBeenCalledWith('@/components/Layout.tsx');
        expect(mockServerLoader.fetch).toHaveBeenCalledWith('file:///project/src/components/Layout.tsx');
      });
    });
  });

  describe('relative', () => {
    it('should return relative path for @ prefixed entries', async () => {
      const fromFile = '/project/src/components/Button.tsx';
      const absolutePath = '/project/src/pages/home.tsx';
      const relativePath = '../pages/home.tsx';

      mockServerLoader.absolute.mockResolvedValue(absolutePath);
      mockServerLoader.relative.mockReturnValue(relativePath);

      const result = await loader.relative(fromFile);

      expect(mockServerLoader.absolute).toHaveBeenCalled();
      expect(mockServerLoader.relative).toHaveBeenCalledWith(fromFile, absolutePath);
      expect(result).toBe(relativePath);
    });

    it('should return entry as-is for module paths', async () => {
      const moduleDocument = {
        entry: 'react-components/Button.tsx',
        id: 'Button.tsx-def456',
        server: mockServer
      } as unknown as Document;
      const moduleLoader = new DocumentLoader(moduleDocument);

      const result = await moduleLoader.relative('/some/file.tsx');

      expect(mockServerLoader.absolute).not.toHaveBeenCalled();
      expect(mockServerLoader.relative).not.toHaveBeenCalled();
      expect(result).toBe('react-components/Button.tsx');
    });

    it('should handle Windows path separators', async () => {
      // Mock Windows-style path
      const originalSep = require('path').sep;
      Object.defineProperty(require('path'), 'sep', { value: '\\' });

      const winDocument = {
        entry: '@\\pages\\home.tsx',
        id: 'home.tsx-abc123',
        server: mockServer
      } as unknown as Document;
      const winLoader = new DocumentLoader(winDocument);
      
      const fromFile = 'C:\\project\\src\\components\\Button.tsx';
      const absolutePath = 'C:\\project\\src\\pages\\home.tsx';
      const relativePath = '..\\pages\\home.tsx';

      mockServerLoader.absolute.mockResolvedValue(absolutePath);
      mockServerLoader.relative.mockReturnValue(relativePath);

      const result = await winLoader.relative(fromFile);

      expect(result).toBe(relativePath);

      // Restore original separator
      Object.defineProperty(require('path'), 'sep', { value: originalSep });
    });

    it('should handle relative paths that do not start with @', async () => {
      const relativeDocument = {
        entry: './pages/home.tsx',
        id: 'home.tsx-abc123',
        server: mockServer
      } as unknown as Document;
      const relativeLoader = new DocumentLoader(relativeDocument);

      const result = await relativeLoader.relative('/some/file.tsx');

      expect(mockServerLoader.absolute).not.toHaveBeenCalled();
      expect(result).toBe('./pages/home.tsx');
    });

    it('should handle absolute paths that do not start with @', async () => {
      const absoluteDocument = {
        entry: '/absolute/path/to/file.tsx',
        id: 'file.tsx-abc123',
        server: mockServer
      } as unknown as Document;
      const absoluteLoader = new DocumentLoader(absoluteDocument);

      const result = await absoluteLoader.relative('/some/file.tsx');

      expect(mockServerLoader.absolute).not.toHaveBeenCalled();
      expect(result).toBe('/absolute/path/to/file.tsx');
    });
  });

  describe('error handling', () => {
    it('should propagate errors from server loader absolute method', async () => {
      const error = new Error('Failed to resolve absolute path');
      mockServerLoader.absolute.mockRejectedValue(error);

      await expect(loader.absolute()).rejects.toThrow('Failed to resolve absolute path');
    });

    it('should propagate errors from server loader import method in production', async () => {
      const prodServer = {
        ...mockServer,
        production: true
      } as unknown as Server;
      const prodDocument = {
        ...mockDocument,
        server: prodServer
      } as unknown as Document;
      const prodLoader = new DocumentLoader(prodDocument);
      
      const error = new Error('Failed to import module');
      mockServerLoader.import.mockRejectedValue(error);

      await expect(prodLoader.import()).rejects.toThrow('Failed to import module');
    });

    it('should propagate errors from server loader resolve method in development', async () => {
      const devServer = {
        ...mockServer,
        production: false
      } as unknown as Server;
      const devDocument = {
        ...mockDocument,
        server: devServer
      } as unknown as Document;
      const devLoader = new DocumentLoader(devDocument);
      
      const error = new Error('Failed to resolve file');
      mockServerLoader.resolve.mockRejectedValue(error);

      await expect(devLoader.import()).rejects.toThrow('Failed to resolve file');
    });

    it('should propagate errors from server loader fetch method in development', async () => {
      const devServer = {
        ...mockServer,
        production: false
      } as unknown as Server;
      const devDocument = {
        ...mockDocument,
        server: devServer
      } as unknown as Document;
      const devLoader = new DocumentLoader(devDocument);
      
      mockServerLoader.resolve.mockResolvedValue({
        filepath: '/project/src/pages/home.tsx'
      });
      const error = new Error('Failed to fetch module');
      mockServerLoader.fetch.mockRejectedValue(error);

      await expect(devLoader.import()).rejects.toThrow('Failed to fetch module');
    });
  });
});
