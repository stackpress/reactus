import { id, renderJSX, writeFile } from '../src/helpers.js';
import fs from 'node:fs/promises';

// Mock fs module
jest.mock('node:fs/promises');

const mockFS = fs as jest.Mocked<typeof fs>;

describe('helpers', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('id function', () => {
    it('should generate consistent hash for same content', () => {
      const content = 'test content';
      const hash1 = id(content);
      const hash2 = id(content);
      
      expect(hash1).toBe(hash2);
      expect(typeof hash1).toBe('string');
      expect(hash1.length).toBe(32); // Default MD5 hash length
    });

    it('should generate different hashes for different content', () => {
      const hash1 = id('content1');
      const hash2 = id('content2');
      
      expect(hash1).not.toBe(hash2);
    });

    it('should respect custom length parameter', () => {
      const content = 'test content';
      const shortHash = id(content, 4);
      const longHash = id(content, 12);
      
      expect(shortHash.length).toBe(4);
      expect(longHash.length).toBe(12);
    });

    it('should generate valid Base62 characters', () => {
      const hash = id('test content');
      const base62Pattern = /^[0-9A-Za-z]+$/;
      
      expect(base62Pattern.test(hash)).toBe(true);
    });

    it('should handle empty string', () => {
      const hash = id('');
      
      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(32);
    });

    it('should handle very long content', () => {
      const longContent = 'a'.repeat(10000);
      const hash = id(longContent);
      
      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(32);
    });
  });

  describe('renderJSX function', () => {
    it('should render simple JSX element', () => {
      const SimpleComponent = () => 'Hello World';
      const result = renderJSX(SimpleComponent);
      
      expect(result).toContain('Hello World');
    });

    it('should render JSX element with props', () => {
      const GreetingComponent = ({ name }: { name: string }) => `Hello ${name}`;
      const result = renderJSX(GreetingComponent, { name: 'John' });
      
      expect(result).toContain('Hello John');
    });

    it('should return empty string when element is undefined', () => {
      const result = renderJSX(undefined);
      
      expect(result).toBe('');
    });

    it('should return empty string when element is null', () => {
      const result = renderJSX(null as any);
      
      expect(result).toBe('');
    });

    it('should handle component with nested elements', () => {
      const NestedComponent = ({ title, content }: { title: string; content: string }) => (
        `<div><h1>${title}</h1><p>${content}</p></div>`
      );
      
      const result = renderJSX(NestedComponent, { 
        title: 'Test Title', 
        content: 'Test Content' 
      });
      
      expect(result).toContain('Test Title');
      expect(result).toContain('Test Content');
    });

    it('should handle empty props object', () => {
      const Component = (props: Record<string, unknown>) => `Props: ${JSON.stringify(props)}`;
      const result = renderJSX(Component, {});
      
      expect(result).toContain('Props: {}');
    });

    it('should handle component that returns string', () => {
      const StringComponent = () => 'Simple string content';
      
      const result = renderJSX(StringComponent);
      
      expect(typeof result).toBe('string');
      expect(result).toContain('Simple string content');
    });
  });

  describe('writeFile function', () => {
    beforeEach(() => {
      // Mock stat to return a promise that rejects (directory doesn't exist)
      mockFS.stat.mockImplementation(() => Promise.reject(new Error('ENOENT')));
      mockFS.mkdir.mockResolvedValue(undefined);
      mockFS.writeFile.mockResolvedValue(undefined);
    });

    it('should write file and return file path', async () => {
      const filePath = '/test/path/file.txt';
      const content = 'test content';
      
      const result = await writeFile(filePath, content);
      
      expect(result).toBe(filePath);
      expect(mockFS.writeFile).toHaveBeenCalledWith(filePath, content);
    });

    it('should create directory if it does not exist', async () => {
      const filePath = '/test/new/directory/file.txt';
      const content = 'test content';
      
      await writeFile(filePath, content);
      
      expect(mockFS.mkdir).toHaveBeenCalledWith('/test/new/directory', { recursive: true });
      expect(mockFS.writeFile).toHaveBeenCalledWith(filePath, content);
    });

    it('should not create directory if it already exists', async () => {
      const filePath = '/test/existing/file.txt';
      const content = 'test content';
      
      // Mock directory exists
      mockFS.stat.mockResolvedValue({} as any);
      
      await writeFile(filePath, content);
      
      expect(mockFS.mkdir).not.toHaveBeenCalled();
      expect(mockFS.writeFile).toHaveBeenCalledWith(filePath, content);
    });

    it('should handle Uint8Array content', async () => {
      const filePath = '/test/binary/file.bin';
      const content = new Uint8Array([1, 2, 3, 4]);
      
      const result = await writeFile(filePath, content);
      
      expect(result).toBe(filePath);
      expect(mockFS.writeFile).toHaveBeenCalledWith(filePath, content);
    });

    it('should handle root directory file', async () => {
      const filePath = '/file.txt';
      const content = 'root content';
      
      await writeFile(filePath, content);
      
      expect(mockFS.writeFile).toHaveBeenCalledWith(filePath, content);
    });

    it('should handle nested directory creation', async () => {
      const filePath = '/very/deep/nested/directory/structure/file.txt';
      const content = 'nested content';
      
      await writeFile(filePath, content);
      
      expect(mockFS.mkdir).toHaveBeenCalledWith(
        '/very/deep/nested/directory/structure', 
        { recursive: true }
      );
      expect(mockFS.writeFile).toHaveBeenCalledWith(filePath, content);
    });

    it('should propagate write errors', async () => {
      const filePath = '/test/file.txt';
      const content = 'test content';
      const writeError = new Error('Write failed');
      
      mockFS.writeFile.mockRejectedValue(writeError);
      
      await expect(writeFile(filePath, content)).rejects.toThrow('Write failed');
    });

    it('should propagate directory creation errors', async () => {
      const filePath = '/test/file.txt';
      const content = 'test content';
      const mkdirError = new Error('Permission denied');
      
      mockFS.mkdir.mockRejectedValue(mkdirError);
      
      await expect(writeFile(filePath, content)).rejects.toThrow('Permission denied');
    });
  });

  describe('integration', () => {
    it('should generate consistent file names for same content', () => {
      const content = 'consistent content';
      const hash1 = id(content);
      const hash2 = id(content);
      
      expect(hash1).toBe(hash2);
      
      const filePath1 = `/cache/${hash1}.txt`;
      const filePath2 = `/cache/${hash2}.txt`;
      
      expect(filePath1).toBe(filePath2);
    });

    it('should render components and generate hashes', () => {
      const Component = ({ message }: { message: string }) => `<div>${message}</div>`;
      const rendered = renderJSX(Component, { message: 'Hello World' });
      const contentId = id(rendered);
      
      expect(rendered).toContain('Hello World');
      expect(typeof contentId).toBe('string');
      expect(contentId.length).toBe(32);
    });

    it('should handle complex component rendering', () => {
      const ComplexComponent = ({ 
        title, 
        items 
      }: { 
        title: string; 
        items: string[] 
      }) => {
        const itemList = items.map(item => `<li>${item}</li>`).join('');
        return `<div><h1>${title}</h1><ul>${itemList}</ul></div>`;
      };
      
      const props = {
        title: 'My List',
        items: ['Item 1', 'Item 2', 'Item 3']
      };
      
      const rendered = renderJSX(ComplexComponent, props);
      const contentHash = id(JSON.stringify(props));
      
      expect(rendered).toContain('My List');
      expect(rendered).toContain('Item 1');
      expect(rendered).toContain('Item 2');
      expect(rendered).toContain('Item 3');
      expect(typeof contentHash).toBe('string');
    });
  });
});
