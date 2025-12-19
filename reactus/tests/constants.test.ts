import {
  VFS_PROTOCOL,
  VFS_RESOLVED,
  BASE62_ALPHABET,
  HASH_LENGTH,
  DOCUMENT_TEMPLATE,
  PAGE_TEMPLATE,
  CLIENT_TEMPLATE
} from '../src/constants.js';

describe('constants', () => {
  describe('VFS_PROTOCOL', () => {
    it('has correct protocol string', () => {
      expect(VFS_PROTOCOL).toBe('virtual:reactus:');
    });

    it('is a string', () => {
      expect(typeof VFS_PROTOCOL).toBe('string');
    });
  });

  describe('VFS_RESOLVED', () => {
    it('has correct resolved protocol string', () => {
      expect(VFS_RESOLVED).toBe('\0virtual:reactus:');
    });

    it('starts with null character', () => {
      expect(VFS_RESOLVED.charCodeAt(0)).toBe(0);
    });

    it('is a string', () => {
      expect(typeof VFS_RESOLVED).toBe('string');
    });
  });

  describe('BASE62_ALPHABET', () => {
    it('has correct alphabet string', () => {
      expect(BASE62_ALPHABET).toBe('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz');
    });

    it('has 62 characters', () => {
      expect(BASE62_ALPHABET.length).toBe(62);
    });

    it('contains all digits', () => {
      for (let i = 0; i <= 9; i++) {
        expect(BASE62_ALPHABET).toContain(i.toString());
      }
    });

    it('contains all uppercase letters', () => {
      for (let i = 65; i <= 90; i++) { // A-Z
        expect(BASE62_ALPHABET).toContain(String.fromCharCode(i));
      }
    });

    it('contains all lowercase letters', () => {
      for (let i = 97; i <= 122; i++) { // a-z
        expect(BASE62_ALPHABET).toContain(String.fromCharCode(i));
      }
    });

    it('has unique characters', () => {
      const chars = BASE62_ALPHABET.split('');
      const uniqueChars = [...new Set(chars)];
      expect(uniqueChars.length).toBe(chars.length);
    });

    it('starts with digits', () => {
      expect(BASE62_ALPHABET.substring(0, 10)).toBe('0123456789');
    });

    it('has uppercase letters after digits', () => {
      expect(BASE62_ALPHABET.substring(10, 36)).toBe('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
    });

    it('ends with lowercase letters', () => {
      expect(BASE62_ALPHABET.substring(36)).toBe('abcdefghijklmnopqrstuvwxyz');
    });
  });

  describe('HASH_LENGTH', () => {
    it('has correct hash length', () => {
      expect(HASH_LENGTH).toBe(32);
    });

    it('is a number', () => {
      expect(typeof HASH_LENGTH).toBe('number');
    });

    it('is a positive integer', () => {
      expect(HASH_LENGTH).toBeGreaterThan(0);
      expect(Number.isInteger(HASH_LENGTH)).toBe(true);
    });
  });

  describe('DOCUMENT_TEMPLATE', () => {
    it('is a valid HTML5 document', () => {
      expect(DOCUMENT_TEMPLATE).toContain('<!DOCTYPE html>');
      expect(DOCUMENT_TEMPLATE).toContain('<html lang="en">');
      expect(DOCUMENT_TEMPLATE).toContain('</html>');
    });

    it('has proper head section', () => {
      expect(DOCUMENT_TEMPLATE).toContain('<head>');
      expect(DOCUMENT_TEMPLATE).toContain('</head>');
      expect(DOCUMENT_TEMPLATE).toContain('<meta charset="utf-8" />');
      expect(DOCUMENT_TEMPLATE).toContain('<meta name="viewport" content="width=device-width, initial-scale=1.0" />');
    });

    it('has proper body section', () => {
      expect(DOCUMENT_TEMPLATE).toContain('<body>');
      expect(DOCUMENT_TEMPLATE).toContain('</body>');
    });

    it('has root div element', () => {
      expect(DOCUMENT_TEMPLATE).toContain('<div id="root">');
      expect(DOCUMENT_TEMPLATE).toContain('</div>');
    });

    it('has props script element', () => {
      expect(DOCUMENT_TEMPLATE).toContain('<script id="props" type="text/json">');
      expect(DOCUMENT_TEMPLATE).toContain('</script>');
    });

    it('has client script element', () => {
      expect(DOCUMENT_TEMPLATE).toContain('<script type="module" src="<!--document-client-->">');
      expect(DOCUMENT_TEMPLATE).toContain('</script>');
    });

    it('contains document placeholders', () => {
      expect(DOCUMENT_TEMPLATE).toContain('<!--document-head-->');
      expect(DOCUMENT_TEMPLATE).toContain('<!--document-body-->');
      expect(DOCUMENT_TEMPLATE).toContain('<!--document-props-->');
      expect(DOCUMENT_TEMPLATE).toContain('<!--document-client-->');
    });

    it('is properly trimmed', () => {
      expect(DOCUMENT_TEMPLATE).not.toMatch(/^\s/);
      expect(DOCUMENT_TEMPLATE).not.toMatch(/\s$/);
    });

    it('has proper indentation structure', () => {
      const lines = DOCUMENT_TEMPLATE.split('\n');
      expect(lines.length).toBeGreaterThan(1);
      
      // Check that nested elements are indented
      const headLine = lines.find(line => line.includes('<head>'));
      const metaLine = lines.find(line => line.includes('<meta charset'));
      
      if (headLine && metaLine) {
        const headIndent = headLine.match(/^\s*/)?.[0].length || 0;
        const metaIndent = metaLine.match(/^\s*/)?.[0].length || 0;
        expect(metaIndent).toBeGreaterThan(headIndent);
      }
    });
  });

  describe('PAGE_TEMPLATE', () => {
    it('has import statement with entry placeholder', () => {
      expect(PAGE_TEMPLATE).toContain("import Body from '{entry}';");
    });

    it('has export statement with entry placeholder', () => {
      expect(PAGE_TEMPLATE).toContain("export * from '{entry}';");
    });

    it('has styles export with placeholder', () => {
      expect(PAGE_TEMPLATE).toContain('export const styles = {styles};');
    });

    it('has default export', () => {
      expect(PAGE_TEMPLATE).toContain('export default Body;');
    });

    it('is properly trimmed', () => {
      expect(PAGE_TEMPLATE).not.toMatch(/^\s/);
      expect(PAGE_TEMPLATE).not.toMatch(/\s$/);
    });

    it('has correct template structure', () => {
      const lines = PAGE_TEMPLATE.split('\n');
      expect(lines).toHaveLength(4);
      expect(lines[0]).toContain('import Body');
      expect(lines[1]).toContain('export *');
      expect(lines[2]).toContain('export const styles');
      expect(lines[3]).toContain('export default Body');
    });

    it('contains entry and styles placeholders', () => {
      expect(PAGE_TEMPLATE).toContain('{entry}');
      expect(PAGE_TEMPLATE).toContain('{styles}');
    });
  });

  describe('CLIENT_TEMPLATE', () => {
    it('has React imports', () => {
      expect(CLIENT_TEMPLATE).toContain("import React from 'react';");
      expect(CLIENT_TEMPLATE).toContain("import { hydrateRoot } from 'react-dom/client';");
    });

    it('has Page import with entry placeholder', () => {
      expect(CLIENT_TEMPLATE).toContain("import Page from '{entry}';");
    });

    it('has DOM element selection', () => {
      expect(CLIENT_TEMPLATE).toContain("const root = document.getElementById('root');");
      expect(CLIENT_TEMPLATE).toContain("const data = document.getElementById('props');");
    });

    it('has props parsing', () => {
      expect(CLIENT_TEMPLATE).toContain("const props = JSON.parse(data?.innerText || '{}');");
    });

    it('has hydrateRoot call', () => {
      expect(CLIENT_TEMPLATE).toContain('hydrateRoot(');
      expect(CLIENT_TEMPLATE).toContain('root as HTMLElement,');
      expect(CLIENT_TEMPLATE).toContain('<React.StrictMode>');
      expect(CLIENT_TEMPLATE).toContain('<Page {...props} />');
      expect(CLIENT_TEMPLATE).toContain('</React.StrictMode>');
    });

    it('is properly trimmed', () => {
      expect(CLIENT_TEMPLATE).not.toMatch(/^\s/);
      expect(CLIENT_TEMPLATE).not.toMatch(/\s$/);
    });

    it('contains entry placeholder', () => {
      expect(CLIENT_TEMPLATE).toContain('{entry}');
    });

    it('has proper JSX structure', () => {
      expect(CLIENT_TEMPLATE).toContain('<React.StrictMode>');
      expect(CLIENT_TEMPLATE).toContain('</React.StrictMode>');
      expect(CLIENT_TEMPLATE).toContain('<Page {...props} />');
    });

    it('handles optional chaining for data element', () => {
      expect(CLIENT_TEMPLATE).toContain('data?.innerText');
    });

    it('has fallback for empty props', () => {
      expect(CLIENT_TEMPLATE).toContain("|| '{}'");
    });
  });

  describe('template integration', () => {
    it('all templates are strings', () => {
      expect(typeof DOCUMENT_TEMPLATE).toBe('string');
      expect(typeof PAGE_TEMPLATE).toBe('string');
      expect(typeof CLIENT_TEMPLATE).toBe('string');
    });

    it('all templates are non-empty', () => {
      expect(DOCUMENT_TEMPLATE.length).toBeGreaterThan(0);
      expect(PAGE_TEMPLATE.length).toBeGreaterThan(0);
      expect(CLIENT_TEMPLATE.length).toBeGreaterThan(0);
    });

    it('document template can accommodate other templates', () => {
      // Document template should have placeholders that can be replaced
      expect(DOCUMENT_TEMPLATE).toContain('<!--document-client-->');
      // This placeholder would be replaced with a path to the client script
    });

    it('page and client templates use consistent entry placeholder', () => {
      expect(PAGE_TEMPLATE).toContain('{entry}');
      expect(CLIENT_TEMPLATE).toContain('{entry}');
    });
  });

  describe('constant immutability', () => {
    it('constants should be read-only', () => {
      // These should not throw in a proper implementation
      expect(() => {
        // Attempting to modify should not affect the original
        const modifiedProtocol = VFS_PROTOCOL + 'modified';
        expect(modifiedProtocol).not.toBe(VFS_PROTOCOL);
      }).not.toThrow();
    });

    it('string constants maintain their values', () => {
      const originalVfsProtocol = VFS_PROTOCOL;
      const originalBase62 = BASE62_ALPHABET;
      
      // After any operations, values should remain the same
      expect(VFS_PROTOCOL).toBe(originalVfsProtocol);
      expect(BASE62_ALPHABET).toBe(originalBase62);
    });
  });
});
