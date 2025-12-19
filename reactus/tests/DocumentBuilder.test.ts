import DocumentBuilder from '../src/DocumentBuilder.js';
import type Document from '../src/Document.js';
import type Server from '../src/Server.js';
import type { BuildResults } from '../src/types.js';

describe('DocumentBuilder', () => {
  let mockDocument: Document;
  let mockServer: Server;
  let mockLoader: any;
  let mockResource: any;
  let mockVfs: any;
  let builder: DocumentBuilder;

  const mockBuildOutput = {
    output: [
      {
        type: 'chunk' as const,
        fileName: 'main.js',
        code: 'console.log("test");'
      },
      {
        type: 'asset' as const,
        fileName: 'assets/style-abc123.css',
        source: '.test { color: red; }'
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock loader
    mockLoader = {
      cwd: '/project',
      absolute: jest.fn().mockResolvedValue('/project/src/pages/home.tsx'),
      relative: jest.fn().mockResolvedValue('./pages/home.tsx')
    };

    // Mock resource
    mockResource = {
      build: jest.fn().mockResolvedValue(mockBuildOutput)
    };

    // Mock VFS
    mockVfs = {
      set: jest.fn().mockReturnValue('vfs://test-file.tsx')
    };

    // Mock server
    mockServer = {
      loader: mockLoader,
      resource: mockResource,
      vfs: mockVfs,
      templates: {
        page: 'const styles = {styles}; export default function Page() { return <div>Test</div>; }',
        client: 'import Component from "{entry}"; export default Component;'
      }
    } as unknown as Server;

    // Mock document
    mockDocument = {
      server: mockServer,
      loader: mockLoader
    } as unknown as Document;

    builder = new DocumentBuilder(mockDocument);
  });

  describe('constructor', () => {
    it('should initialize with document and server references', () => {
      expect(builder['_document']).toBe(mockDocument);
      expect(builder['_server']).toBe(mockServer);
    });
  });

  describe('buildAssets', () => {
    it('should build assets with correct template and config', async () => {
      const result = await builder.buildAssets();

      expect(mockVfs.set).toHaveBeenCalledWith(
        '/project/src/pages/home.tsx.assets.tsx',
        'const styles = []; export default function Page() { return <div>Test</div>; }'
      );
      expect(mockResource.build).toHaveBeenCalledWith({
        configFile: false,
        root: '/project',
        build: {
          write: false,
          rollupOptions: {
            input: 'vfs://test-file.tsx',
            output: {
              format: 'es',
              entryFileNames: '[name].js'
            }
          }
        }
      });
      expect(result).toBe(mockBuildOutput.output);
    });
  });

  describe('buildClient', () => {
    it('should build client with correct template and config', async () => {
      const result = await builder.buildClient();

      expect(mockVfs.set).toHaveBeenCalledWith(
        '/project/src/pages/home.tsx.client.tsx',
        'import Component from "./pages/home.tsx"; export default Component;'
      );
      expect(mockResource.build).toHaveBeenCalledWith({
        configFile: false,
        root: '/project',
        build: {
          write: false,
          rollupOptions: {
            input: 'vfs://test-file.tsx',
            output: {
              format: 'es',
              entryFileNames: '[name].js'
            }
          }
        }
      });
      expect(result).toBe(mockBuildOutput.output);
    });
  });

  describe('buildPage', () => {
    it('should build page with provided assets', async () => {
      const assets: BuildResults = [
        {
          type: 'chunk' as const,
          fileName: 'main.js',
          code: 'export default function() {}'
        } as any,
        {
          type: 'asset' as const,
          fileName: 'assets/style-abc123.css',
          source: '.test { color: red; }'
        } as any,
        {
          type: 'asset' as const,
          fileName: 'assets/script-def456.js',
          source: 'console.log("test");'
        } as any
      ];

      const result = await builder.buildPage(assets);

      expect(mockVfs.set).toHaveBeenCalledWith(
        '/project/src/pages/home.tsx.page.tsx',
        'const styles = ["style-abc123.css"]; export default function Page() { return <div>Test</div>; }'
      );
      expect(mockResource.build).toHaveBeenCalledWith({
        configFile: false,
        root: '/project',
        build: {
          write: false,
          rollupOptions: {
            preserveEntrySignatures: 'exports-only',
            input: 'vfs://test-file.tsx',
            external: ['react', 'react-dom', 'react/jsx-runtime'],
            output: {
              format: 'es',
              entryFileNames: '[name].js',
              exports: 'named',
              globals: {
                react: 'React',
                'react-dom': 'ReactDOM',
                'react/jsx-runtime': 'jsxRuntime'
              }
            }
          }
        }
      });
      expect(result).toBe(mockBuildOutput.output);
    });

    it('should build assets first if not provided', async () => {
      const buildAssetsSpy = jest.spyOn(builder, 'buildAssets').mockResolvedValue([
        {
          type: 'chunk' as const,
          fileName: 'main.js',
          code: 'export default function() {}'
        } as any,
        {
          type: 'asset' as const,
          fileName: 'assets/style-xyz789.css',
          source: '.auto { color: blue; }'
        } as any
      ]);

      await builder.buildPage();

      expect(buildAssetsSpy).toHaveBeenCalled();
      expect(mockVfs.set).toHaveBeenCalledWith(
        '/project/src/pages/home.tsx.page.tsx',
        'const styles = ["style-xyz789.css"]; export default function Page() { return <div>Test</div>; }'
      );
    });

    it('should filter assets correctly for styles', async () => {
      const assets: BuildResults = [
        {
          type: 'chunk' as const,
          fileName: 'main.js',
          code: 'export default function() {}'
        } as any,
        {
          type: 'asset' as const,
          fileName: 'assets/style1.css',
          source: '.test1 { color: red; }'
        } as any,
        {
          type: 'asset' as const,
          fileName: 'assets/style2.css',
          source: '.test2 { color: blue; }'
        } as any,
        {
          type: 'asset' as const,
          fileName: 'other/style3.css', // Should be filtered out
          source: '.test3 { color: green; }'
        } as any,
        {
          type: 'asset' as const,
          fileName: 'assets/script.js', // Should be filtered out
          source: 'console.log("test");'
        } as any,
        {
          type: 'chunk' as const,
          fileName: 'assets/chunk.css', // Should be filtered out
          code: '.chunk { color: yellow; }'
        } as any
      ];

      await builder.buildPage(assets);

      expect(mockVfs.set).toHaveBeenCalledWith(
        '/project/src/pages/home.tsx.page.tsx',
        'const styles = ["style1.css","style2.css"]; export default function Page() { return <div>Test</div>; }'
      );
    });
  });

  describe('_renderVFS', () => {
    it('should render template with correct entry replacement', async () => {
      const template = 'import Component from "{entry}"; export { Component };';
      
      const result = await builder['_renderVFS']('test', template);

      expect(mockLoader.absolute).toHaveBeenCalled();
      expect(mockLoader.relative).toHaveBeenCalledWith('/project/src/pages/home.tsx.test.tsx');
      expect(mockVfs.set).toHaveBeenCalledWith(
        '/project/src/pages/home.tsx.test.tsx',
        'import Component from "./pages/home.tsx"; export { Component };'
      );
      expect(result).toBe('vfs://test-file.tsx');
    });

    it('should handle multiple entry replacements', async () => {
      const template = 'import {entry} from "{entry}"; export default {entry};';
      
      await builder['_renderVFS']('multi', template);

      expect(mockVfs.set).toHaveBeenCalledWith(
        '/project/src/pages/home.tsx.multi.tsx',
        'import ./pages/home.tsx from "./pages/home.tsx"; export default ./pages/home.tsx;'
      );
    });
  });

  describe('build option methods', () => {
    it('should generate correct asset build options', async () => {
      const url = 'vfs://test.tsx';
      const options = await builder['_getAssetBuildOptions'](url);

      expect(options).toEqual({
        configFile: false,
        root: '/project',
        build: {
          write: false,
          rollupOptions: {
            input: url,
            output: {
              format: 'es',
              entryFileNames: '[name].js'
            }
          }
        }
      });
    });

    it('should generate correct client build options', async () => {
      const url = 'vfs://test.tsx';
      const options = await builder['_getClientBuildOptions'](url);

      expect(options).toEqual({
        configFile: false,
        root: '/project',
        build: {
          write: false,
          rollupOptions: {
            input: url,
            output: {
              format: 'es',
              entryFileNames: '[name].js'
            }
          }
        }
      });
    });

    it('should generate correct page build options', async () => {
      const url = 'vfs://test.tsx';
      const options = await builder['_getPageBuildOptions'](url);

      expect(options).toEqual({
        configFile: false,
        root: '/project',
        build: {
          write: false,
          rollupOptions: {
            preserveEntrySignatures: 'exports-only',
            input: url,
            external: ['react', 'react-dom', 'react/jsx-runtime'],
            output: {
              format: 'es',
              entryFileNames: '[name].js',
              exports: 'named',
              globals: {
                react: 'React',
                'react-dom': 'ReactDOM',
                'react/jsx-runtime': 'jsxRuntime'
              }
            }
          }
        }
      });
    });
  });
});
