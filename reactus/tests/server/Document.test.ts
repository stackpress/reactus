import Document from '../../src/server/Document.js';
import Server from '../../src/server/Server.js';
import { id, renderJSX } from '../../src/server/helpers.js';

// Mock dependencies
jest.mock('../../src/server/Server.js');
jest.mock('../../src/server/helpers.js');

const mockId = id as jest.MockedFunction<typeof id>;
const mockRenderJSX = renderJSX as jest.MockedFunction<typeof renderJSX>;

describe('server/Document', () => {
  let mockServer: jest.Mocked<Server>;
  let document: Document;

  beforeEach(() => {
    mockServer = {
      paths: { page: '/test/page' },
      routes: { client: '/client', css: '/assets' },
      templates: { document: '<html><!--document-head--><!--document-body--><!--document-props--><!--document-client--></html>' },
      import: jest.fn()
    } as unknown as jest.Mocked<Server>;

    document = new Document('/test/entry.tsx', mockServer);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('sets entry and server properties', () => {
      expect(document.entry).toBe('/test/entry.tsx');
      expect(document.server).toBe(mockServer);
    });

    it('makes properties readonly', () => {
      // TypeScript readonly is compile-time only, so we just verify the properties exist
      expect(document.entry).toBe('/test/entry.tsx');
      expect(document.server).toBe(mockServer);
      
      // In a real scenario, TypeScript would prevent these assignments at compile time
      // At runtime, the properties can still be assigned but shouldn't be
      const originalEntry = document.entry;
      const originalServer = document.server;
      
      expect(originalEntry).toBe('/test/entry.tsx');
      expect(originalServer).toBe(mockServer);
    });
  });

  describe('id getter', () => {
    it('generates ID using entry and hash', () => {
      mockId.mockReturnValue('abc123de');

      const result = document.id;

      expect(mockId).toHaveBeenCalledWith('/test/entry.tsx', 8);
      expect(result).toBe('entry.tsx-abc123de');
    });

    it('handles different entry formats', () => {
      const document1 = new Document('@/components/Button.tsx', mockServer);
      const document2 = new Document('module/path/Component.tsx', mockServer);
      
      mockId.mockReturnValue('hash1234');

      expect(document1.id).toBe('Button.tsx-hash1234');
      expect(document2.id).toBe('Component.tsx-hash1234');
    });

    it('handles entries without extensions', () => {
      const document = new Document('/test/entry', mockServer);
      mockId.mockReturnValue('hash5678');

      expect(document.id).toBe('entry-hash5678');
    });
  });

  describe('import()', () => {
    it('imports page component from correct path', async () => {
      const mockImport = {
        default: () => 'Component',
        Head: () => 'Head',
        styles: ['style1.css']
      };
      
      mockId.mockReturnValue('abc123de');
      mockServer.import.mockResolvedValue(mockImport);

      const result = await document.import();

      expect(mockServer.import).toHaveBeenCalledWith('/test/page/entry.tsx-abc123de.js');
      expect(result).toBe(mockImport);
    });

    it('handles import errors', async () => {
      mockId.mockReturnValue('abc123de');
      mockServer.import.mockRejectedValue(new Error('Import failed'));

      await expect(document.import()).rejects.toThrow('Import failed');
    });
  });

  describe('renderMarkup()', () => {
    let mockDocumentImport: any;

    beforeEach(() => {
      mockDocumentImport = {
        default: jest.fn(),
        Head: jest.fn(),
        styles: ['style1.css', 'style2.css']
      };

      mockId.mockReturnValue('abc123de');
      mockServer.import.mockResolvedValue(mockDocumentImport);
    });

    it('renders complete HTML markup with all components', async () => {
      const props = { title: 'Test Page', data: { count: 5 } };
      
      mockRenderJSX
        .mockReturnValueOnce('<div>Body Content</div>') // body
        .mockReturnValueOnce('<title>Test Page</title>'); // head

      const result = await document.renderMarkup(props);

      expect(mockServer.import).toHaveBeenCalledWith('/test/page/entry.tsx-abc123de.js');
      
      // Check body rendering
      expect(mockRenderJSX).toHaveBeenCalledWith(mockDocumentImport.default, props);
      
      // Check head rendering with styles
      expect(mockRenderJSX).toHaveBeenCalledWith(mockDocumentImport.Head, {
        ...props,
        styles: ['/assets/style1.css', '/assets/style2.css']
      });

      expect(result).toBe('<html><title>Test Page</title><div>Body Content</div>{"title":"Test Page","data":{"count":5}}/client/entry.tsx-abc123de.js</html>');
    });

    it('handles empty props', async () => {
      mockRenderJSX
        .mockReturnValueOnce('<div>Default Content</div>')
        .mockReturnValueOnce('<title>Default</title>');

      const result = await document.renderMarkup();

      expect(mockRenderJSX).toHaveBeenCalledWith(mockDocumentImport.default, {});
      expect(mockRenderJSX).toHaveBeenCalledWith(mockDocumentImport.Head, {
        styles: ['/assets/style1.css', '/assets/style2.css']
      });

      expect(result).toContain('{}'); // empty props JSON
    });

    it('handles missing Head component', async () => {
      mockDocumentImport.Head = undefined;
      
      mockRenderJSX
        .mockReturnValueOnce('<div>Body Content</div>')
        .mockReturnValueOnce(''); // head returns empty

      const result = await document.renderMarkup({ title: 'Test' });

      expect(mockRenderJSX).toHaveBeenCalledWith(undefined, {
        title: 'Test',
        styles: ['/assets/style1.css', '/assets/style2.css']
      });

      expect(result).toContain('<html><div>Body Content</div>'); // no head content
    });

    it('handles missing styles array', async () => {
      mockDocumentImport.styles = undefined;
      
      mockRenderJSX
        .mockReturnValueOnce('<div>Body Content</div>')
        .mockReturnValueOnce('<title>Test</title>');

      await document.renderMarkup({ title: 'Test' });

      expect(mockRenderJSX).toHaveBeenCalledWith(mockDocumentImport.Head, {
        title: 'Test',
        styles: []
      });
    });

    it('handles empty styles array', async () => {
      mockDocumentImport.styles = [];
      
      mockRenderJSX
        .mockReturnValueOnce('<div>Body Content</div>')
        .mockReturnValueOnce('<title>Test</title>');

      await document.renderMarkup({ title: 'Test' });

      expect(mockRenderJSX).toHaveBeenCalledWith(mockDocumentImport.Head, {
        title: 'Test',
        styles: []
      });
    });

    it('handles null render results', async () => {
      mockRenderJSX
        .mockReturnValueOnce('') // body returns empty string
        .mockReturnValueOnce(''); // head returns empty string

      const result = await document.renderMarkup({ title: 'Test' });

      expect(result).toBe('<html>{"title":"Test"}/client/entry.tsx-abc123de.js</html>');
    });

    it('properly escapes JSON props', async () => {
      const props = {
        title: 'Test "quoted" content',
        script: '<script>alert("xss")</script>',
        data: { nested: { value: 'test' } }
      };

      mockRenderJSX
        .mockReturnValueOnce('<div>Content</div>')
        .mockReturnValueOnce('<title>Test</title>');

      const result = await document.renderMarkup(props);

      const expectedJson = JSON.stringify(props);
      expect(result).toContain(expectedJson);
    });

    it('generates correct client route', async () => {
      mockRenderJSX
        .mockReturnValueOnce('<div>Content</div>')
        .mockReturnValueOnce('<title>Test</title>');

      const result = await document.renderMarkup();

      expect(result).toContain('/client/entry.tsx-abc123de.js');
    });

    it('generates correct CSS routes', async () => {
      mockRenderJSX
        .mockReturnValueOnce('<div>Content</div>')
        .mockReturnValueOnce('<title>Test</title>');

      await document.renderMarkup();

      expect(mockRenderJSX).toHaveBeenCalledWith(mockDocumentImport.Head, {
        styles: ['/assets/style1.css', '/assets/style2.css']
      });
    });
  });

  describe('integration scenarios', () => {
    it('handles complex entry paths', () => {
      const testCases = [
        { entry: '@/pages/home.tsx', expected: 'home.tsx' },
        { entry: 'module/components/Button.tsx', expected: 'Button.tsx' },
        { entry: '/absolute/path/Component.tsx', expected: 'Component.tsx' },
        { entry: '../relative/path/Page.tsx', expected: 'Page.tsx' },
        { entry: 'simple-file.tsx', expected: 'simple-file.tsx' }
      ];

      testCases.forEach(({ entry, expected }) => {
        const doc = new Document(entry, mockServer);
        mockId.mockReturnValue('hash1234');
        
        expect(doc.id).toBe(`${expected}-hash1234`);
      });
    });

    it('maintains consistent ID generation', () => {
      const entry = '/test/component.tsx';
      const doc1 = new Document(entry, mockServer);
      const doc2 = new Document(entry, mockServer);

      mockId.mockReturnValue('samehash');

      expect(doc1.id).toBe(doc2.id);
    });

    it('handles server configuration changes', async () => {
      // Create new server with different configuration
      const newMockServer = {
        paths: { page: '/test/page' },
        routes: { client: '/scripts', css: '/styles' },
        templates: { 
          document: '<html><head><!--document-head--></head><body><!--document-body--><!--document-props--><!--document-client--></body></html>' 
        },
        import: jest.fn()
      } as unknown as jest.Mocked<Server>;

      const newDocument = new Document('/test/entry.tsx', newMockServer);

      const mockImport = {
        default: jest.fn(),
        Head: jest.fn(),
        styles: ['main.css']
      };

      mockId.mockReturnValue('newhash');
      newMockServer.import.mockResolvedValue(mockImport);
      mockRenderJSX
        .mockReturnValueOnce('<main>New Content</main>')
        .mockReturnValueOnce('<title>New Title</title>');

      const result = await newDocument.renderMarkup({ page: 'new' });

      expect(result).toContain('/scripts/entry.tsx-newhash.js'); // new client route
      expect(mockRenderJSX).toHaveBeenCalledWith(mockImport.Head, {
        page: 'new',
        styles: ['/styles/main.css'] // new css route
      });
    });
  });
});
