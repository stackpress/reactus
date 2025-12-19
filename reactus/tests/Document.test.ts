import Document from '../src/Document.js';
import DocumentBuilder from '../src/DocumentBuilder.js';
import DocumentLoader from '../src/DocumentLoader.js';
import DocumentRender from '../src/DocumentRender.js';
import type Server from '../src/Server.js';

// Mock the helper function
jest.mock('../src/helpers.js', () => ({
  id: jest.fn()
}));

// Mock the document classes
jest.mock('../src/DocumentBuilder.js');
jest.mock('../src/DocumentLoader.js');
jest.mock('../src/DocumentRender.js');

import { id } from '../src/helpers.js';

const mockId = id as jest.MockedFunction<typeof id>;
const MockDocumentBuilder = DocumentBuilder as jest.MockedClass<typeof DocumentBuilder>;
const MockDocumentLoader = DocumentLoader as jest.MockedClass<typeof DocumentLoader>;
const MockDocumentRender = DocumentRender as jest.MockedClass<typeof DocumentRender>;

describe('Document', () => {
  let mockServer: Server;
  let document: Document;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a minimal mock server
    mockServer = {} as Server;
    
    // Mock the id function to return a predictable hash
    mockId.mockReturnValue('abc12345');
  });

  describe('constructor', () => {
    it('should initialize with entry and server', () => {
      const entry = '@/pages/home.tsx';
      
      document = new Document(entry, mockServer);
      
      expect(document.entry).toBe(entry);
      expect(document.server).toBe(mockServer);
    });

    it('should create builder, loader, and render instances', () => {
      const entry = '@/pages/home.tsx';
      
      document = new Document(entry, mockServer);
      
      expect(MockDocumentBuilder).toHaveBeenCalledWith(document);
      expect(MockDocumentLoader).toHaveBeenCalledWith(document);
      expect(MockDocumentRender).toHaveBeenCalledWith(document);
      expect(document.builder).toBeInstanceOf(DocumentBuilder);
      expect(document.loader).toBeInstanceOf(DocumentLoader);
      expect(document.render).toBeInstanceOf(DocumentRender);
    });
  });

  describe('id getter', () => {
    it('should generate id from entry basename and hash', () => {
      const entry = '@/pages/home.tsx';
      document = new Document(entry, mockServer);
      
      const result = document.id;
      
      expect(mockId).toHaveBeenCalledWith(entry, 8);
      expect(result).toBe('home.tsx-abc12345');
    });

    it('should handle nested paths correctly', () => {
      const entry = '@/components/ui/Button.tsx';
      document = new Document(entry, mockServer);
      
      const result = document.id;
      
      expect(mockId).toHaveBeenCalledWith(entry, 8);
      expect(result).toBe('Button.tsx-abc12345');
    });

    it('should handle module paths', () => {
      const entry = 'react-components/Button.tsx';
      document = new Document(entry, mockServer);
      
      const result = document.id;
      
      expect(mockId).toHaveBeenCalledWith(entry, 8);
      expect(result).toBe('Button.tsx-abc12345');
    });

    it('should handle files without extension', () => {
      const entry = '@/pages/index';
      document = new Document(entry, mockServer);
      
      const result = document.id;
      
      expect(mockId).toHaveBeenCalledWith(entry, 8);
      expect(result).toBe('index-abc12345');
    });
  });

  describe('property access', () => {
    beforeEach(() => {
      document = new Document('@/pages/home.tsx', mockServer);
    });

    it('should provide access to entry property', () => {
      expect(document.entry).toBe('@/pages/home.tsx');
    });

    it('should provide access to server property', () => {
      expect(document.server).toBe(mockServer);
    });

    it('should provide access to builder property', () => {
      expect(document.builder).toBeInstanceOf(DocumentBuilder);
    });

    it('should provide access to loader property', () => {
      expect(document.loader).toBeInstanceOf(DocumentLoader);
    });

    it('should provide access to render property', () => {
      expect(document.render).toBeInstanceOf(DocumentRender);
    });
  });
});
