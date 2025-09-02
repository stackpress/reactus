import path from 'node:path';
import Builder from '../src/Builder.js';
import type { ServerConfig } from '../src/types.js';

// Helper to create test data
const makeServerConfig = (overrides: Partial<ServerConfig> = {}): ServerConfig => ({
  assetPath: '/project/public/assets',
  basePath: '/',
  clientPath: '/project/public/client',
  clientRoute: '/client',
  clientTemplate: 'export { entry } from "%s";',
  cssRoute: '/assets',
  cwd: '/project',
  documentTemplate: '<!DOCTYPE html><html><head>%s</head><body>%s</body></html>',
  pagePath: '/project/.reactus/page',
  pageTemplate: 'export { entry } from "%s";',
  plugins: [],
  production: false,
  ...overrides
});

describe('Builder', () => {
  let builder: Builder;
  let config: ServerConfig;

  beforeEach(() => {
    config = makeServerConfig();
    builder = new Builder(config);
  });

  describe('constructor', () => {
    it('should create a Builder instance that extends Server', () => {
      expect(builder).toBeInstanceOf(Builder);
      expect(builder.paths.asset).toBe('/project/public/assets');
      expect(builder.paths.client).toBe('/project/public/client');
      expect(builder.paths.page).toBe('/project/.reactus/page');
    });

    it('should inherit Server properties and methods', () => {
      expect(builder.manifest).toBeDefined();
      expect(typeof builder.manifest.values).toBe('function');
    });
  });

  describe('buildAssets', () => {
    it('should return empty array when no documents exist', async () => {
      const results = await builder.buildAssets();
      expect(Array.isArray(results)).toBe(true);
      expect(results).toHaveLength(0);
    });

    it('should process asset outputs correctly', async () => {
      // Create a mock document with proper structure
      const mockDocument = {
        id: 'test-123',
        entry: '@/pages/home.tsx',
        builder: {
          buildAssets: jest.fn().mockResolvedValue([
            {
              type: 'asset',
              fileName: 'assets/style.css',
              source: 'body { margin: 0; }'
            }
          ])
        }
      };

      // Mock the manifest to return our test document
      jest.spyOn(builder.manifest, 'values').mockReturnValue([mockDocument] as any);

      // Mock writeFile to avoid actual file operations
      const writeFileSpy = jest.spyOn(await import('../src/helpers.js'), 'writeFile')
        .mockResolvedValue('/mocked/file/path');

      const results = await builder.buildAssets();

      expect(results).toHaveLength(1);
      expect(results[0].code).toBe(200);
      expect(results[0].status).toBe('OK');
      expect(results[0].results?.type).toBe('asset');
      expect(results[0].results?.id).toBe('test-123');
      expect(results[0].results?.destination).toBe(
        path.join(config.assetPath, 'style.css')
      );

      expect(writeFileSpy).toHaveBeenCalledWith(
        path.join(config.assetPath, 'style.css'),
        'body { margin: 0; }'
      );

      writeFileSpy.mockRestore();
    });

    it('should handle build failures gracefully', async () => {
      const mockDocument = {
        id: 'fail-123',
        entry: '@/pages/fail.tsx',
        builder: {
          buildAssets: jest.fn().mockResolvedValue(null)
        }
      };

      jest.spyOn(builder.manifest, 'values').mockReturnValue([mockDocument] as any);

      const results = await builder.buildAssets();

      expect(results).toHaveLength(1);
      expect(results[0].code).toBe(500);
      expect(results[0].error).toContain("Assets for '@/pages/fail.tsx' was not generated");
    });

    it('should skip non-asset outputs', async () => {
      const mockDocument = {
        id: 'test-123',
        entry: '@/pages/home.tsx',
        builder: {
          buildAssets: jest.fn().mockResolvedValue([
            { type: 'chunk', fileName: 'main.js', code: 'console.log("test");' }
          ])
        }
      };

      jest.spyOn(builder.manifest, 'values').mockReturnValue([mockDocument] as any);

      const results = await builder.buildAssets();

      expect(results).toHaveLength(0);
    });

    it('should reject assets not in assets/ directory', async () => {
      const mockDocument = {
        id: 'test-123',
        entry: '@/pages/home.tsx',
        builder: {
          buildAssets: jest.fn().mockResolvedValue([
            {
              type: 'asset',
              fileName: 'invalid/style.css',
              source: 'body { color: red; }'
            }
          ])
        }
      };

      jest.spyOn(builder.manifest, 'values').mockReturnValue([mockDocument] as any);

      const results = await builder.buildAssets();

      expect(results).toHaveLength(1);
      expect(results[0].code).toBe(404);
      expect(results[0].error).toContain("asset 'invalid/style.css' was not saved");
    });
  });

  describe('buildClients', () => {
    it('should return empty array when no documents exist', async () => {
      const results = await builder.buildClients();
      expect(Array.isArray(results)).toBe(true);
      expect(results).toHaveLength(0);
    });

    it('should process client chunks correctly', async () => {
      const mockDocument = {
        id: 'client-123',
        entry: '@/pages/home.tsx',
        builder: {
          buildClient: jest.fn().mockResolvedValue([
            {
              type: 'chunk',
              code: 'console.log("client code");'
            }
          ])
        },
        loader: {
          absolute: jest.fn().mockResolvedValue('/project/pages/home.tsx')
        }
      };

      jest.spyOn(builder.manifest, 'values').mockReturnValue([mockDocument] as any);

      const writeFileSpy = jest.spyOn(await import('../src/helpers.js'), 'writeFile')
        .mockResolvedValue('/mocked/file/path');

      const results = await builder.buildClients();

      expect(results).toHaveLength(1);
      expect(results[0].code).toBe(200);
      expect(results[0].results?.type).toBe('client');
      expect(results[0].results?.destination).toBe(
        path.join(config.clientPath, 'client-123.js')
      );

      writeFileSpy.mockRestore();
    });

    it('should handle missing chunk output', async () => {
      const mockDocument = {
        id: 'test-123',
        entry: '@/pages/home.tsx',
        builder: {
          buildClient: jest.fn().mockResolvedValue([
            { type: 'asset', fileName: 'style.css', source: 'body {}' }
          ])
        }
      };

      jest.spyOn(builder.manifest, 'values').mockReturnValue([mockDocument] as any);

      const results = await builder.buildClients();

      expect(results).toHaveLength(1);
      expect(results[0].code).toBe(404);
      expect(results[0].error).toContain("Client '@/pages/home.tsx' was not generated");
    });
  });

  describe('buildPages', () => {
    it('should return empty array when no documents exist', async () => {
      const results = await builder.buildPages();
      expect(Array.isArray(results)).toBe(true);
      expect(results).toHaveLength(0);
    });

    it('should process page chunks correctly', async () => {
      const mockDocument = {
        id: 'page-123',
        entry: '@/pages/home.tsx',
        builder: {
          buildPage: jest.fn().mockResolvedValue([
            {
              type: 'chunk',
              code: 'export const entry = () => "page";'
            }
          ])
        },
        loader: {
          absolute: jest.fn().mockResolvedValue('/project/pages/home.tsx')
        }
      };

      jest.spyOn(builder.manifest, 'values').mockReturnValue([mockDocument] as any);

      const writeFileSpy = jest.spyOn(await import('../src/helpers.js'), 'writeFile')
        .mockResolvedValue('/mocked/file/path');

      const results = await builder.buildPages();

      expect(results).toHaveLength(1);
      expect(results[0].code).toBe(200);
      expect(results[0].results?.type).toBe('page');
      expect(results[0].results?.destination).toBe(
        path.join(config.pagePath, 'page-123.js')
      );

      writeFileSpy.mockRestore();
    });
  });

  describe('integration', () => {
    it('should handle multiple documents with different outcomes', async () => {
      const successDoc = {
        id: 'success-123',
        entry: '@/pages/success.tsx',
        builder: {
          buildClient: jest.fn().mockResolvedValue([
            { type: 'chunk', code: 'success code' }
          ])
        },
        loader: {
          absolute: jest.fn().mockResolvedValue('/project/pages/success.tsx')
        }
      };

      const failDoc = {
        id: 'fail-456',
        entry: '@/pages/fail.tsx',
        builder: {
          buildClient: jest.fn().mockResolvedValue(null)
        }
      };

      jest.spyOn(builder.manifest, 'values').mockReturnValue([successDoc, failDoc] as any);

      const writeFileSpy = jest.spyOn(await import('../src/helpers.js'), 'writeFile')
        .mockResolvedValue('/mocked/file/path');

      const results = await builder.buildClients();

      expect(results).toHaveLength(2);
      expect(results[0].code).toBe(200);
      expect(results[1].code).toBe(500);

      writeFileSpy.mockRestore();
    });

    it('should use correct file paths based on configuration', () => {
      const customConfig = makeServerConfig({
        assetPath: '/custom/assets',
        clientPath: '/custom/client',
        pagePath: '/custom/pages'
      });

      const customBuilder = new Builder(customConfig);

      expect(customBuilder.paths.asset).toBe('/custom/assets');
      expect(customBuilder.paths.client).toBe('/custom/client');
      expect(customBuilder.paths.page).toBe('/custom/pages');
    });
  });
});
