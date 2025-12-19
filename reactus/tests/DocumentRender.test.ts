import DocumentRender from '../src/DocumentRender.js';
import type Document from '../src/Document.js';
import type Server from '../src/Server.js';
import type { DocumentImport } from '../src/types.js';

// Mock the helper function
jest.mock('../src/helpers.js', () => ({
  renderJSX: jest.fn()
}));

import { renderJSX } from '../src/helpers.js';

const mockRenderJSX = renderJSX as jest.MockedFunction<typeof renderJSX>;

describe('DocumentRender', () => {
  let mockDocument: Document;
  let mockServer: Server;
  let mockLoader: any;
  let mockResource: any;
  let mockVfs: any;
  let mockDev: any;
  let render: DocumentRender;

  const mockDocumentImport: DocumentImport = {
    default: () => '<div>Test Component</div>',
    Head: () => '<title>Test</title>',
    styles: ['style1.css', 'style2.css']
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock dev server
    mockDev = {
      transformRequest: jest.fn(),
      transformIndexHtml: jest.fn()
    };

    // Mock loader
    mockLoader = {
      import: jest.fn().mockResolvedValue(mockDocumentImport),
      absolute: jest.fn().mockResolvedValue('/project/src/pages/home.tsx'),
      relative: jest.fn().mockResolvedValue('./pages/home.tsx')
    };

    // Mock resource
    mockResource = {
      dev: jest.fn().mockResolvedValue(mockDev)
    };

    // Mock VFS
    mockVfs = {
      set: jest.fn().mockReturnValue('vfs://test-file.tsx')
    };

    // Mock server
    mockServer = {
      production: false,
      resource: mockResource,
      vfs: mockVfs,
      routes: {
        client: '/client',
        css: '/assets'
      },
      templates: {
        client: 'import Component from "{entry}"; export default Component;',
        document: '<!DOCTYPE html><html><head><!--document-head--></head><body><!--document-body--><script>window.__PROPS__ = <!--document-props-->;</script><script type="module" src="<!--document-client-->"></script></body></html>'
      }
    } as unknown as Server;

    // Mock document
    mockDocument = {
      id: 'home.tsx-abc123',
      loader: mockLoader,
      server: mockServer
    } as unknown as Document;

    render = new DocumentRender(mockDocument);
  });

  describe('constructor', () => {
    it('should initialize with document and server references', () => {
      expect(render['_document']).toBe(mockDocument);
      expect(render['_server']).toBe(mockServer);
    });
  });

  describe('renderHMRClient', () => {
    it('should render HMR client code successfully', async () => {
      const transformedCode = 'import Component from "./pages/home.tsx"; export default Component;';
      mockDev.transformRequest.mockResolvedValue({ code: transformedCode });

      const result = await render.renderHMRClient();

      expect(mockResource.dev).toHaveBeenCalled();
      expect(mockVfs.set).toHaveBeenCalledWith(
        '/project/src/pages/home.tsx.hmr.tsx',
        'import Component from "./pages/home.tsx"; export default Component;'
      );
      expect(mockDev.transformRequest).toHaveBeenCalledWith('vfs://test-file.tsx', { ssr: false });
      expect(result).toBe(transformedCode);
    });

    it('should throw exception when transformation fails', async () => {
      mockDev.transformRequest.mockResolvedValue(null);

      await expect(render.renderHMRClient()).rejects.toThrow('File tsx to js transformation failed');
    });

    it('should handle transformation errors', async () => {
      const error = new Error('Transform failed');
      mockDev.transformRequest.mockRejectedValue(error);

      await expect(render.renderHMRClient()).rejects.toThrow('Transform failed');
    });
  });

  describe('renderMarkup', () => {
    it('should render production markup when in production mode', async () => {
      const prodServer = {
        ...mockServer,
        production: true
      } as unknown as Server;
      const prodDocument = {
        ...mockDocument,
        server: prodServer
      } as unknown as Document;
      const prodRender = new DocumentRender(prodDocument);
      
      mockRenderJSX.mockReturnValueOnce('<div>Test Component</div>');
      mockRenderJSX.mockReturnValueOnce('<title>Test</title>');

      const props = { title: 'Test Page' };
      const result = await prodRender.renderMarkup(props);

      expect(mockLoader.import).toHaveBeenCalled();
      expect(mockRenderJSX).toHaveBeenCalledWith(mockDocumentImport.default, props);
      expect(mockRenderJSX).toHaveBeenCalledWith(mockDocumentImport.Head, {
        ...props,
        styles: ['/assets/style1.css', '/assets/style2.css']
      });
      expect(result).toContain('<div>Test Component</div>');
      expect(result).toContain('<title>Test</title>');
      expect(result).toContain('/client/home.tsx-abc123.js');
      expect(result).toContain(JSON.stringify(props));
    });

    it('should render development markup when in development mode', async () => {
      const devServer = {
        ...mockServer,
        production: false
      } as unknown as Server;
      const devDocument = {
        ...mockDocument,
        server: devServer
      } as unknown as Document;
      const devRender = new DocumentRender(devDocument);
      
      mockDev.transformIndexHtml.mockResolvedValue('<!DOCTYPE html><html><head><!--document-head--><script type="module" src="/@vite/client"></script></head><body><!--document-body--><script>window.__PROPS__ = <!--document-props-->;</script><script type="module" src="<!--document-client-->"></script></body></html>');
      mockRenderJSX.mockReturnValueOnce('<div>Test Component</div>');
      mockRenderJSX.mockReturnValueOnce('<title>Test</title>');

      const props = { title: 'Test Page' };
      const result = await devRender.renderMarkup(props);

      expect(mockResource.dev).toHaveBeenCalled();
      expect(mockDev.transformIndexHtml).toHaveBeenCalledWith('', mockServer.templates.document);
      expect(mockRenderJSX).toHaveBeenCalledWith(mockDocumentImport.default, props);
      expect(mockRenderJSX).toHaveBeenCalledWith(mockDocumentImport.Head, props);
      expect(result).toContain('<div>Test Component</div>');
      expect(result).toContain('<title>Test</title>');
      expect(result).toContain('/client/home.tsx-abc123.tsx');
      expect(result).toContain(JSON.stringify(props));
    });

    it('should handle empty props', async () => {
      const prodServer = {
        ...mockServer,
        production: true
      } as unknown as Server;
      const prodDocument = {
        ...mockDocument,
        server: prodServer
      } as unknown as Document;
      const prodRender = new DocumentRender(prodDocument);
      
      mockRenderJSX.mockReturnValueOnce('<div>Test Component</div>');
      mockRenderJSX.mockReturnValueOnce('<title>Test</title>');

      const result = await prodRender.renderMarkup();

      expect(mockRenderJSX).toHaveBeenCalledWith(mockDocumentImport.default, {});
      expect(result).toContain('{}');
    });

    it('should handle missing Head component', async () => {
      const prodServer = {
        ...mockServer,
        production: true
      } as unknown as Server;
      const prodDocument = {
        ...mockDocument,
        server: prodServer
      } as unknown as Document;
      const prodRender = new DocumentRender(prodDocument);
      
      const documentWithoutHead = {
        default: () => '<div>Test Component</div>',
        styles: []
      };
      mockLoader.import.mockResolvedValue(documentWithoutHead);
      mockRenderJSX.mockReturnValueOnce('<div>Test Component</div>');
      mockRenderJSX.mockReturnValueOnce('');

      const result = await prodRender.renderMarkup();

      expect(result).toContain('<div>Test Component</div>');
      expect(result).not.toContain('null');
    });

    it('should handle missing styles', async () => {
      const prodServer = {
        ...mockServer,
        production: true
      } as unknown as Server;
      const prodDocument = {
        ...mockDocument,
        server: prodServer
      } as unknown as Document;
      const prodRender = new DocumentRender(prodDocument);
      
      const documentWithoutStyles = {
        default: () => '<div>Test Component</div>',
        Head: () => '<title>Test</title>'
      };
      mockLoader.import.mockResolvedValue(documentWithoutStyles);
      mockRenderJSX.mockReturnValueOnce('<div>Test Component</div>');
      mockRenderJSX.mockReturnValueOnce('<title>Test</title>');

      const result = await prodRender.renderMarkup();

      expect(mockRenderJSX).toHaveBeenCalledWith(documentWithoutStyles.Head, {
        styles: []
      });
      expect(result).toContain('<div>Test Component</div>');
    });
  });

  describe('_renderDevMarkup', () => {
    it('should render development markup with Vite integration', async () => {
      const transformedHtml = '<!DOCTYPE html><html><head><!--document-head--><script type="module" src="/@vite/client"></script></head><body><!--document-body--><script>window.__PROPS__ = <!--document-props-->;</script><script type="module" src="<!--document-client-->"></script></body></html>';
      mockDev.transformIndexHtml.mockResolvedValue(transformedHtml);
      mockRenderJSX.mockReturnValueOnce('<div>Body Content</div>');
      mockRenderJSX.mockReturnValueOnce('<title>Head Content</title>');

      const props = { test: 'value' };
      const result = await render['_renderDevMarkup'](props);

      expect(mockDev.transformIndexHtml).toHaveBeenCalledWith('', mockServer.templates.document);
      expect(result).toContain('<div>Body Content</div>');
      expect(result).toContain('<title>Head Content</title>');
      expect(result).toContain('/client/home.tsx-abc123.tsx');
      expect(result).toContain(JSON.stringify(props));
    });

    it('should handle null head and body content', async () => {
      const transformedHtml = '<!DOCTYPE html><html><head><!--document-head--></head><body><!--document-body--><script>window.__PROPS__ = <!--document-props-->;</script><script type="module" src="<!--document-client-->"></script></body></html>';
      mockDev.transformIndexHtml.mockResolvedValue(transformedHtml);
      mockRenderJSX.mockReturnValueOnce('');
      mockRenderJSX.mockReturnValueOnce('');

      const result = await render['_renderDevMarkup']();

      expect(result).not.toContain('null');
      expect(result).toContain('{}');
    });
  });

  describe('_renderMarkup', () => {
    it('should render production markup with CSS routes', async () => {
      mockRenderJSX.mockReturnValueOnce('<div>Production Content</div>');
      mockRenderJSX.mockReturnValueOnce('<title>Production Title</title>');

      const props = { production: true };
      const result = await render['_renderMarkup'](props);

      expect(mockRenderJSX).toHaveBeenCalledWith(mockDocumentImport.Head, {
        ...props,
        styles: ['/assets/style1.css', '/assets/style2.css']
      });
      expect(result).toContain('<div>Production Content</div>');
      expect(result).toContain('<title>Production Title</title>');
      expect(result).toContain('/client/home.tsx-abc123.js');
    });

    it('should handle empty styles array', async () => {
      const documentWithEmptyStyles = {
        ...mockDocumentImport,
        styles: []
      };
      mockLoader.import.mockResolvedValue(documentWithEmptyStyles);
      mockRenderJSX.mockReturnValueOnce('<div>Content</div>');
      mockRenderJSX.mockReturnValueOnce('<title>Title</title>');

      const result = await render['_renderMarkup']();

      expect(mockRenderJSX).toHaveBeenCalledWith(documentWithEmptyStyles.Head, {
        styles: []
      });
      expect(result).toContain('<div>Content</div>');
    });
  });

  describe('_renderVFS', () => {
    it('should render template with correct entry replacement', async () => {
      const template = 'import Component from "{entry}"; export { Component };';
      
      const result = await render['_renderVFS']('test', template);

      expect(mockLoader.absolute).toHaveBeenCalled();
      expect(mockLoader.relative).toHaveBeenCalledWith('/project/src/pages/home.tsx.test.tsx');
      expect(mockVfs.set).toHaveBeenCalledWith(
        '/project/src/pages/home.tsx.test.tsx',
        'import Component from "./pages/home.tsx"; export { Component };'
      );
      expect(result).toBe('vfs://test-file.tsx');
    });

    it('should handle Windows path separators', async () => {
      mockLoader.absolute.mockResolvedValue('C:\\project\\src\\pages\\home.tsx');
      const template = 'import Component from "{entry}";';
      
      await render['_renderVFS']('test', template);

      expect(mockVfs.set).toHaveBeenCalledWith(
        'C:\\project\\src\\pages\\home.tsx.test.tsx',
        'import Component from "./pages/home.tsx";'
      );
    });

    it('should handle multiple entry replacements', async () => {
      const template = 'import {entry} from "{entry}"; export default {entry};';
      
      await render['_renderVFS']('multi', template);

      expect(mockVfs.set).toHaveBeenCalledWith(
        '/project/src/pages/home.tsx.multi.tsx',
        'import ./pages/home.tsx from "./pages/home.tsx"; export default ./pages/home.tsx;'
      );
    });
  });

  describe('error handling', () => {
    it('should propagate loader import errors', async () => {
      const error = new Error('Import failed');
      mockLoader.import.mockRejectedValue(error);

      await expect(render.renderMarkup()).rejects.toThrow('Import failed');
    });

    it('should propagate dev server errors', async () => {
      const error = new Error('Dev server failed');
      mockResource.dev.mockRejectedValue(error);

      await expect(render.renderHMRClient()).rejects.toThrow('Dev server failed');
    });

    it('should propagate VFS errors', async () => {
      const error = new Error('VFS failed');
      mockVfs.set.mockImplementation(() => {
        throw error;
      });

      await expect(render.renderHMRClient()).rejects.toThrow('VFS failed');
    });

    it('should propagate loader absolute path errors', async () => {
      const error = new Error('Absolute path failed');
      mockLoader.absolute.mockRejectedValue(error);

      await expect(render.renderHMRClient()).rejects.toThrow('Absolute path failed');
    });
  });
});
