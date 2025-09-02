import React from 'react';
import { configure, id, renderJSX } from '../../src/server/helpers.js';
import { DOCUMENT_TEMPLATE } from '../../src/server/constants.js';
import NodeFS from '@stackpress/lib/NodeFS';

// Mock dependencies
jest.mock('@stackpress/lib/NodeFS');
jest.mock('react-dom/server', () => ({
  renderToString: jest.fn()
}));

const MockedNodeFS = NodeFS as jest.MockedClass<typeof NodeFS>;

// Import the mocked renderToString
import { renderToString } from 'react-dom/server';
const mockRenderToString = renderToString as jest.MockedFunction<typeof renderToString>;

describe('server/helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('configure()', () => {
    it('returns default configuration when no options provided', () => {
      const config = configure({});

      expect(config).toEqual({
        clientRoute: '/client',
        cssRoute: '/assets',
        cwd: process.cwd(),
        documentTemplate: DOCUMENT_TEMPLATE,
        fs: expect.any(NodeFS),
        pagePath: expect.stringContaining('.reactus/page')
      });
    });

    it('merges provided options with defaults', () => {
      const customOptions = {
        clientRoute: '/custom-client',
        cssRoute: '/custom-assets',
        cwd: '/custom/path',
        documentTemplate: '<html>Custom Template</html>',
        pagePath: '/custom/page/path'
      };

      const config = configure(customOptions);

      expect(config).toEqual({
        clientRoute: '/custom-client',
        cssRoute: '/custom-assets',
        cwd: '/custom/path',
        documentTemplate: '<html>Custom Template</html>',
        fs: expect.any(NodeFS),
        pagePath: '/custom/page/path'
      });
    });

    it('uses custom file system when provided', () => {
      const customFS = new MockedNodeFS();
      const config = configure({ fs: customFS });

      expect(config.fs).toBe(customFS);
    });

    it('returns frozen configuration object', () => {
      const config = configure({});

      expect(Object.isFrozen(config)).toBe(true);
      expect(() => {
        (config as any).clientRoute = '/modified';
      }).toThrow();
    });

    it('handles partial options correctly', () => {
      const config = configure({
        clientRoute: '/api',
        cwd: '/project'
      });

      expect(config.clientRoute).toBe('/api');
      expect(config.cwd).toBe('/project');
      expect(config.cssRoute).toBe('/assets'); // default
      expect(config.documentTemplate).toBe(DOCUMENT_TEMPLATE); // default
    });

    it('constructs correct page path from cwd', () => {
      const customCwd = '/my/project';
      const config = configure({ cwd: customCwd });

      expect(config.pagePath).toBe('/my/project/.reactus/page');
    });

    it('preserves custom page path when provided', () => {
      const customPagePath = '/custom/build/pages';
      const config = configure({ pagePath: customPagePath });

      expect(config.pagePath).toBe(customPagePath);
    });
  });

  describe('id()', () => {
    it('generates consistent hash for same content', () => {
      const content = 'test content';
      const hash1 = id(content);
      const hash2 = id(content);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(32); // default HASH_LENGTH
    });

    it('generates different hashes for different content', () => {
      const hash1 = id('content1');
      const hash2 = id('content2');

      expect(hash1).not.toBe(hash2);
    });

    it('respects custom length parameter', () => {
      const content = 'test content';
      const shortHash = id(content, 8);
      const longHash = id(content, 16);

      expect(shortHash).toHaveLength(8);
      expect(longHash).toHaveLength(16);
    });

    it('uses Base62 alphabet characters only', () => {
      const content = 'test content';
      const hash = id(content);
      const base62Regex = /^[0-9A-Za-z]+$/;

      expect(base62Regex.test(hash)).toBe(true);
    });

    it('pads short hashes with zeros', () => {
      // Test with content that would generate a very short hash
      const content = '';
      const hash = id(content, 10);

      expect(hash).toHaveLength(10);
      expect(hash.startsWith('0')).toBe(true);
    });

    it('handles empty string content', () => {
      const hash = id('');

      expect(hash).toHaveLength(32);
      expect(typeof hash).toBe('string');
    });

    it('handles very long content', () => {
      const longContent = 'a'.repeat(10000);
      const hash = id(longContent);

      expect(hash).toHaveLength(32);
      expect(typeof hash).toBe('string');
    });

    it('handles special characters in content', () => {
      const specialContent = '!@#$%^&*()_+{}|:"<>?[]\\;\',./ 🚀 ñ ü';
      const hash = id(specialContent);

      expect(hash).toHaveLength(32);
      expect(typeof hash).toBe('string');
    });

    it('generates different hashes for similar content', () => {
      const hash1 = id('test');
      const hash2 = id('Test');
      const hash3 = id('test ');

      expect(hash1).not.toBe(hash2);
      expect(hash1).not.toBe(hash3);
      expect(hash2).not.toBe(hash3);
    });

    it('handles Unicode content correctly', () => {
      const unicodeContent = '中文 العربية русский 🌟';
      const hash = id(unicodeContent);

      expect(hash).toHaveLength(32);
      expect(typeof hash).toBe('string');
    });
  });

  describe('renderJSX()', () => {
    beforeEach(() => {
      mockRenderToString.mockReturnValue('<div>Rendered Content</div>');
    });

    it('renders JSX element with props', () => {
      const TestComponent = ({ title }: { title: string }) => React.createElement('h1', null, title);
      const props = { title: 'Test Title' };

      const result = renderJSX(TestComponent, props);

      expect(mockRenderToString).toHaveBeenCalledWith(
        expect.objectContaining({
          type: React.StrictMode,
          props: {
            children: expect.objectContaining({
              type: TestComponent,
              props: props
            })
          }
        })
      );
      expect(result).toBe('<div>Rendered Content</div>');
    });

    it('renders element without props', () => {
      const TestComponent = () => React.createElement('div', null, 'No props');

      const result = renderJSX(TestComponent);

      expect(mockRenderToString).toHaveBeenCalledWith(
        expect.objectContaining({
          type: React.StrictMode,
          props: {
            children: expect.objectContaining({
              type: TestComponent,
              props: {}
            })
          }
        })
      );
      expect(result).toBe('<div>Rendered Content</div>');
    });

    it('returns empty string when element is undefined', () => {
      const result = renderJSX(undefined);

      expect(mockRenderToString).not.toHaveBeenCalled();
      expect(result).toBe('');
    });

    it('returns empty string when element is null', () => {
      const result = renderJSX(null as any);

      expect(mockRenderToString).not.toHaveBeenCalled();
      expect(result).toBe('');
    });

    it('wraps component in React.StrictMode', () => {
      const TestComponent = () => React.createElement('span', null, 'Test');

      renderJSX(TestComponent, { test: 'prop' });

      expect(mockRenderToString).toHaveBeenCalledWith(
        expect.objectContaining({
          type: React.StrictMode
        })
      );
    });

    it('passes props correctly to component', () => {
      const TestComponent = () => React.createElement('div');
      const props = { 
        title: 'Test',
        count: 42,
        nested: { value: 'test' }
      };

      renderJSX(TestComponent, props);

      expect(mockRenderToString).toHaveBeenCalledWith(
        expect.objectContaining({
          props: {
            children: expect.objectContaining({
              props: props
            })
          }
        })
      );
    });

    it('handles complex props structure', () => {
      const TestComponent = () => React.createElement('div');
      const complexProps = {
        user: { id: 1, name: 'John' },
        settings: { theme: 'dark', notifications: true },
        items: [1, 2, 3],
        callback: () => 'test'
      };

      renderJSX(TestComponent, complexProps);

      expect(mockRenderToString).toHaveBeenCalledWith(
        expect.objectContaining({
          props: {
            children: expect.objectContaining({
              props: complexProps
            })
          }
        })
      );
    });

    it('handles functional components', () => {
      const FunctionalComponent = (props: { message: string }) => 
        React.createElement('p', null, props.message);

      renderJSX(FunctionalComponent, { message: 'Hello World' });

      expect(mockRenderToString).toHaveBeenCalledWith(
        expect.objectContaining({
          type: React.StrictMode,
          props: {
            children: expect.objectContaining({
              type: FunctionalComponent,
              props: { message: 'Hello World' }
            })
          }
        })
      );
    });

    it('handles class components', () => {
      class ClassComponent extends React.Component<{ title: string }> {
        render() {
          return React.createElement('h1', null, this.props.title);
        }
      }

      renderJSX(ClassComponent, { title: 'Class Component' });

      expect(mockRenderToString).toHaveBeenCalledWith(
        expect.objectContaining({
          type: React.StrictMode,
          props: {
            children: expect.objectContaining({
              type: ClassComponent,
              props: { title: 'Class Component' }
            })
          }
        })
      );
    });
  });

  describe('integration scenarios', () => {
    it('configure and id work together for consistent builds', () => {
      const config1 = configure({ cwd: '/project1' });
      const config2 = configure({ cwd: '/project2' });

      const content = 'same content';
      const hash1 = id(content);
      const hash2 = id(content);

      // Different configs should not affect hash generation
      expect(hash1).toBe(hash2);
      expect(config1.cwd).not.toBe(config2.cwd);
    });

    it('renderJSX handles components that use configured routes', () => {
      const config = configure({
        clientRoute: '/scripts',
        cssRoute: '/styles'
      });

      const ComponentWithRoutes = ({ routes }: { routes: any }) =>
        React.createElement('div', null, `Client: ${routes.client}, CSS: ${routes.css}`);

      mockRenderToString.mockReturnValue('<div>Client: /scripts, CSS: /styles</div>');

      const result = renderJSX(ComponentWithRoutes, { 
        routes: { 
          client: config.clientRoute, 
          css: config.cssRoute 
        } 
      });

      expect(result).toBe('<div>Client: /scripts, CSS: /styles</div>');
    });

    it('id generation is deterministic across multiple calls', () => {
      const content = 'deterministic test';
      const hashes = Array.from({ length: 10 }, () => id(content));

      // All hashes should be identical
      expect(new Set(hashes).size).toBe(1);
    });

    it('configure creates valid paths for different environments', () => {
      const devConfig = configure({
        cwd: '/dev/project',
        clientRoute: '/dev-client',
        cssRoute: '/dev-assets'
      });

      const prodConfig = configure({
        cwd: '/prod/project',
        clientRoute: '/client',
        cssRoute: '/assets'
      });

      expect(devConfig.pagePath).toBe('/dev/project/.reactus/page');
      expect(prodConfig.pagePath).toBe('/prod/project/.reactus/page');
      expect(devConfig.clientRoute).toBe('/dev-client');
      expect(prodConfig.clientRoute).toBe('/client');
    });
  });
});
