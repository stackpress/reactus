import VirtualServer from '../src/VirtualServer.js';
import { VFS_PROTOCOL } from '../src/constants.js';

describe('VirtualServer', () => {
  let virtualServer: VirtualServer;

  beforeEach(() => {
    virtualServer = new VirtualServer();
  });

  describe('constructor', () => {
    it('initializes with empty virtual file system', () => {
      expect(virtualServer.fs.size).toBe(0);
    });

    it('creates a callable map for fs property', () => {
      expect(typeof virtualServer.fs).toBe('function');
      expect(virtualServer.fs.size).toBe(0);
    });
  });

  describe('set()', () => {
    it('encodes and stores file contents in VFS', () => {
      const filepath = '/test/file.txt';
      const contents = 'Hello, World!';
      
      const result = virtualServer.set(filepath, contents);
      
      expect(result).toBe(`${VFS_PROTOCOL}${filepath}`);
      expect(virtualServer.fs.has(filepath)).toBe(true);
    });

    it('returns VFS protocol URL for stored file', () => {
      const filepath = '/components/Button.tsx';
      const contents = 'export default function Button() { return <button>Click</button>; }';
      
      const result = virtualServer.set(filepath, contents);
      
      expect(result).toBe(`${VFS_PROTOCOL}${filepath}`);
    });

    it('encodes contents as base64', () => {
      const filepath = '/test.js';
      const contents = 'console.log("test");';
      
      virtualServer.set(filepath, contents);
      
      // Get the raw stored data
      const storedData = virtualServer.fs.get(filepath);
      const expectedBase64 = Buffer.from(contents).toString('base64');
      
      expect(storedData).toBe(expectedBase64);
    });

    it('handles empty string contents', () => {
      const filepath = '/empty.txt';
      const contents = '';
      
      const result = virtualServer.set(filepath, contents);
      
      expect(result).toBe(`${VFS_PROTOCOL}${filepath}`);
      expect(virtualServer.has(filepath)).toBe(true);
    });

    it('handles special characters in contents', () => {
      const filepath = '/special.txt';
      const contents = 'Special chars: 🚀 ñ ü © ® ™';
      
      const result = virtualServer.set(filepath, contents);
      
      expect(result).toBe(`${VFS_PROTOCOL}${filepath}`);
      expect(virtualServer.get(filepath)).toBe(contents);
    });

    it('overwrites existing files', () => {
      const filepath = '/overwrite.txt';
      const originalContents = 'Original content';
      const newContents = 'New content';
      
      virtualServer.set(filepath, originalContents);
      const result = virtualServer.set(filepath, newContents);
      
      expect(result).toBe(`${VFS_PROTOCOL}${filepath}`);
      expect(virtualServer.get(filepath)).toBe(newContents);
    });
  });

  describe('get()', () => {
    it('returns decoded file contents from VFS', () => {
      const filepath = '/test/file.txt';
      const contents = 'Hello, World!';
      
      virtualServer.set(filepath, contents);
      const result = virtualServer.get(filepath);
      
      expect(result).toBe(contents);
    });

    it('returns null for non-existent files', () => {
      const result = virtualServer.get('/non-existent.txt');
      
      expect(result).toBeNull();
    });

    it('handles complex file contents', () => {
      const filepath = '/component.tsx';
      const contents = `
import React from 'react';

interface Props {
  title: string;
  onClick: () => void;
}

export default function Button({ title, onClick }: Props) {
  return (
    <button onClick={onClick} className="btn">
      {title}
    </button>
  );
}
      `.trim();
      
      virtualServer.set(filepath, contents);
      const result = virtualServer.get(filepath);
      
      expect(result).toBe(contents);
    });

    it('handles JSON content', () => {
      const filepath = '/config.json';
      const contents = JSON.stringify({
        name: 'test-app',
        version: '1.0.0',
        dependencies: {
          react: '^18.0.0'
        }
      }, null, 2);
      
      virtualServer.set(filepath, contents);
      const result = virtualServer.get(filepath);
      
      expect(result).toBe(contents);
    });

    it('handles binary-like content', () => {
      const filepath = '/binary.dat';
      const contents = '\x00\x01\x02\x03\xFF';
      
      virtualServer.set(filepath, contents);
      const result = virtualServer.get(filepath);
      
      expect(result).toBe(contents);
    });
  });

  describe('has()', () => {
    it('returns true for existing files', () => {
      const filepath = '/existing.txt';
      
      virtualServer.set(filepath, 'content');
      
      expect(virtualServer.has(filepath)).toBe(true);
    });

    it('returns false for non-existent files', () => {
      expect(virtualServer.has('/non-existent.txt')).toBe(false);
    });

    it('returns true immediately after setting a file', () => {
      const filepath = '/immediate.txt';
      
      virtualServer.set(filepath, 'test content');
      
      expect(virtualServer.has(filepath)).toBe(true);
    });

    it('handles empty file paths', () => {
      expect(virtualServer.has('')).toBe(false);
    });

    it('is case sensitive', () => {
      const filepath = '/CaseSensitive.txt';
      
      virtualServer.set(filepath, 'content');
      
      expect(virtualServer.has(filepath)).toBe(true);
      expect(virtualServer.has('/casesensitive.txt')).toBe(false);
      expect(virtualServer.has('/CASESENSITIVE.TXT')).toBe(false);
    });
  });

  describe('integration scenarios', () => {
    it('handles multiple files in VFS', () => {
      const files = [
        { path: '/src/index.ts', content: 'export * from "./components";' },
        { path: '/src/components/Button.tsx', content: 'export default function Button() {}' },
        { path: '/src/styles/main.css', content: '.btn { color: blue; }' }
      ];
      
      files.forEach(file => {
        virtualServer.set(file.path, file.content);
      });
      
      files.forEach(file => {
        expect(virtualServer.has(file.path)).toBe(true);
        expect(virtualServer.get(file.path)).toBe(file.content);
      });
      
      expect(virtualServer.fs.size).toBe(files.length);
    });

    it('maintains file isolation', () => {
      const file1 = { path: '/file1.txt', content: 'Content 1' };
      const file2 = { path: '/file2.txt', content: 'Content 2' };
      
      virtualServer.set(file1.path, file1.content);
      virtualServer.set(file2.path, file2.content);
      
      expect(virtualServer.get(file1.path)).toBe(file1.content);
      expect(virtualServer.get(file2.path)).toBe(file2.content);
      
      // Modifying one shouldn't affect the other
      virtualServer.set(file1.path, 'Modified content');
      expect(virtualServer.get(file1.path)).toBe('Modified content');
      expect(virtualServer.get(file2.path)).toBe(file2.content);
    });

    it('handles nested directory structures', () => {
      const files = [
        '/src/components/ui/Button.tsx',
        '/src/components/ui/Input.tsx',
        '/src/pages/home/index.tsx',
        '/src/pages/about/index.tsx',
        '/public/assets/logo.svg'
      ];
      
      files.forEach((filepath, index) => {
        virtualServer.set(filepath, `Content ${index}`);
      });
      
      files.forEach((filepath, index) => {
        expect(virtualServer.has(filepath)).toBe(true);
        expect(virtualServer.get(filepath)).toBe(`Content ${index}`);
      });
    });

    it('preserves content encoding/decoding integrity', () => {
      const testCases = [
        'Simple text',
        'Text with\nnewlines\nand\ttabs',
        'Unicode: 🚀 ñ ü © ® ™ 中文 العربية',
        JSON.stringify({ complex: { nested: { object: true } } }),
        'Binary-like: \x00\x01\x02\x03\xFF\xFE\xFD',
        ''  // Empty string
      ];
      
      testCases.forEach((content, index) => {
        const filepath = `/test-${index}.txt`;
        virtualServer.set(filepath, content);
        expect(virtualServer.get(filepath)).toBe(content);
      });
    });
  });
});
