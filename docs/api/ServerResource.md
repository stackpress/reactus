# ServerResource

The ServerResource class provides Vite integration for Reactus applications. It manages the development server, build processes, middleware, and plugin configuration for asset handling and Hot Module Replacement (HMR). This class serves as the bridge between Reactus and Vite, enabling modern development workflows while maintaining the simplicity of server-side rendering.

```typescript
import { ServerResource } from 'reactus';

// ServerResource is typically accessed through a Server instance
const resource = server.resource;
```

 1. [Properties](#1-properties)
 2. [Methods](#2-methods)
 3. [Static Methods](#3-static-methods)
 4. [Integration Examples](#4-integration-examples)

## 1. Properties

The following properties are available when instantiating a ServerResource. These properties provide access to the Vite configuration and the parent server instance for seamless integration.

| Property | Type | Description |
|----------|------|-------------|
| `config` | `InlineConfig` | Vite configuration object |
| `server` | `Server` | Reference to the parent server instance |

## 2. Methods

The following methods are available when instantiating a ServerResource. These methods provide comprehensive Vite integration capabilities including development server management, production builds, middleware handling, and plugin configuration.

### 2.1. Starting Development Server

Starts the Vite development server with Hot Module Replacement (HMR) support. This method initializes the development environment with fast refresh capabilities and asset serving.

```typescript
const viteServer = await resource.dev();
console.log('Vite dev server started');
```

**Returns**

A promise that resolves to the Vite development server instance.

### 2.2. Building for Production

Builds assets for production using Vite's build system. This method handles code splitting, minification, and optimization for deployment.

```typescript
const buildResult = await resource.build({
  build: {
    outDir: './dist',
    minify: true
  }
});
console.log('Build completed');
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `config` | `InlineConfig` | Vite build configuration |

**Returns**

A promise that resolves when the build is complete.

### 2.3. Getting Middleware Stack

Retrieves the Vite middleware stack for integration with web servers like Express or Fastify. This middleware handles asset serving, HMR, and development features.

```typescript
const middleware = await resource.middlewares();
// Use with Express, Fastify, etc.
```

**Returns**

A promise that resolves to the Vite middleware function.

### 2.4. Getting Plugin Configuration

Returns the configured Vite plugins including Reactus-specific plugins and any custom plugins defined in the configuration.

```typescript
const plugins = await resource.plugins();
console.log('Available plugins:', plugins.length);
```

**Returns**

A promise that resolves to an array of Vite plugins.

## 3. Static Methods

The ServerResource class does not expose any static methods. All functionality is provided through instance methods that operate on the Vite configuration and server integration.

## 4. Integration Examples

The following examples demonstrate how to integrate ServerResource with various web frameworks and deployment scenarios, showcasing the flexibility of Vite integration.

### 4.1. Development Server Setup

This example demonstrates how to configure and start a Vite development server with Reactus integration. The development server provides hot module replacement and fast refresh capabilities for an optimal development experience.

```typescript
const server = new Server({
  cwd: process.cwd(),
  production: false,
  vite: {
    server: {
      port: 3000,
      host: 'localhost'
    }
  }
});

// Start Vite dev server
const viteServer = await server.resource.dev();
console.log('Development server running');

// Get middleware for Express integration
const middleware = await server.resource.middlewares();
app.use(middleware);
```

### 4.2. Production Build

This example shows how to configure and execute a production build with optimized settings. The build process includes minification, code splitting, and asset optimization for deployment.

```typescript
const server = new Server({
  cwd: process.cwd(),
  production: true,
  vite: {
    build: {
      outDir: './dist',
      minify: 'terser',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom']
          }
        }
      }
    }
  }
});

// Build for production
await server.resource.build(server.resource.config);
console.log('Production build complete');
```

### 4.3. Custom Plugin Configuration

This example demonstrates how to add custom Vite plugins to extend the build process. You can integrate both Reactus-specific plugins and standard Vite plugins for enhanced functionality.

```typescript
const server = new Server({
  cwd: process.cwd(),
  plugins: [
    // Custom Vite plugins
    {
      name: 'custom-plugin',
      configResolved(config) {
        console.log('Vite config resolved');
      }
    }
  ],
  vite: {
    plugins: [
      // Additional Vite plugins
    ]
  }
});

// Get all plugins (including Reactus defaults)
const allPlugins = await server.resource.plugins();
console.log('Total plugins:', allPlugins.length);
```

### 4.4. Middleware Integration

This example shows how to integrate Vite middleware with Express.js for development server functionality. The middleware handles asset serving, HMR, and development features seamlessly.

```typescript
// Express integration
import express from 'express';

const app = express();
const server = new Server({ production: false });

// Get Vite middleware
const viteMiddleware = await server.resource.middlewares();

// Use Vite middleware for HMR and asset serving
app.use(viteMiddleware);

// Your application routes
app.get('/', async (req, res) => {
  const html = await server.manifest.get('@/pages/home')
    .then(doc => doc.render.renderMarkup());
  res.send(html);
});

app.listen(3000);
```

### 4.5. Fastify Integration

This example demonstrates how to integrate ServerResource with Fastify web framework. The integration provides the same development capabilities as Express while leveraging Fastify's performance benefits.

```typescript
import Fastify from 'fastify';

const fastify = Fastify();
const server = new Server({ production: false });

// Register Vite middleware
await fastify.register(async (fastify) => {
  const viteServer = await server.resource.dev();
  
  fastify.addHook('onRequest', async (request, reply) => {
    // Use Vite's middleware
    const middleware = await server.resource.middlewares();
    return new Promise((resolve) => {
      middleware(request.raw, reply.raw, resolve);
    });
  });
});

// Application routes
fastify.get('/', async (request, reply) => {
  const html = await server.manifest.get('@/pages/home')
    .then(doc => doc.render.renderMarkup());
  reply.type('text/html').send(html);
});

await fastify.listen({ port: 3000 });
```

### 4.6. Error Handling

This example shows proper error handling patterns when working with ServerResource methods. It covers common error scenarios and provides appropriate error messages for debugging.

```typescript
const server = new Server({ production: false });

try {
  const viteServer = await server.resource.dev();
  console.log('Vite server started successfully');
} catch (error) {
  if (error.message.includes('Port already in use')) {
    console.error('Port 3000 is already in use');
  } else if (error.message.includes('Vite config error')) {
    console.error('Invalid Vite configuration:', error);
  } else {
    console.error('Failed to start Vite server:', error);
  }
}

try {
  await server.resource.build(server.resource.config);
  console.log('Build successful');
} catch (error) {
  if (error.message.includes('Build failed')) {
    console.error('Vite build failed:', error);
  } else {
    console.error('Unknown build error:', error);
  }
}
```

### 4.7. Custom Build Pipeline

This example demonstrates how to create a custom build pipeline with additional analysis and monitoring capabilities. The pipeline extends the standard build process with custom plugins and performance tracking.

```typescript
// Create a custom build pipeline
class CustomBuildPipeline {
  constructor(private resource: ServerResource) {}
  
  async buildWithAnalysis() {
    const startTime = Date.now();
    
    // Custom build configuration
    const buildConfig = {
      ...this.resource.config,
      build: {
        ...this.resource.config.build,
        rollupOptions: {
          ...this.resource.config.build?.rollupOptions,
          plugins: [
            // Add bundle analyzer
            {
              name: 'bundle-analyzer',
              generateBundle(options, bundle) {
                const analysis = this.analyzeBundles(bundle);
                console.log('Bundle analysis:', analysis);
              }
            }
          ]
        }
      }
    };
    
    // Run build
    await this.resource.build(buildConfig);
    
    const buildTime = Date.now() - startTime;
    console.log(`Custom build completed in ${buildTime}ms`);
  }
  
  private analyzeBundles(bundle: any) {
    const chunks = Object.values(bundle);
    return {
      totalChunks: chunks.length,
      totalSize: chunks.reduce((size: number, chunk: any) => 
        size + (chunk.code?.length || 0), 0
      ),
      chunkTypes: chunks.reduce((types: any, chunk: any) => {
        const type = chunk.isEntry ? 'entry' : 
                    chunk.isDynamicEntry ? 'dynamic' : 'chunk';
        types[type] = (types[type] || 0) + 1;
        return types;
      }, {})
    };
  }
}

// Usage
const pipeline = new CustomBuildPipeline(server.resource);
await pipeline.buildWithAnalysis();
```

### 4.8. Development vs Production Configuration

This example shows how to configure different settings for development and production environments. It demonstrates environment-specific optimizations and feature toggles.

```typescript
// Development configuration
const devServer = new Server({
  cwd: process.cwd(),
  production: false,
  vite: {
    server: {
      port: 3000,
      open: true,
      cors: true
    },
    optimizeDeps: {
      include: ['react', 'react-dom']
    },
    define: {
      __DEV__: true
    }
  }
});

// Production configuration
const prodServer = new Server({
  cwd: process.cwd(),
  production: true,
  vite: {
    build: {
      minify: 'terser',
      sourcemap: false,
      cssMinify: true,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            utils: ['lodash', 'date-fns']
          }
        }
      },
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      }
    },
    define: {
      __DEV__: false,
      'process.env.NODE_ENV': '"production"'
    }
  }
});

if (devServer.production) {
  await prodServer.resource.build(prodServer.resource.config);
} else {
  await devServer.resource.dev();
}
```

### 4.9. Plugin Development

This example demonstrates how to create custom Vite plugins for Reactus applications. The plugin system allows you to extend the build process with custom transformations and hooks.

```typescript
// Create a custom Reactus plugin
function createReactusPlugin(options: any = {}) {
  return {
    name: 'reactus-custom',
    configResolved(config: any) {
      // Access resolved config
      console.log('Reactus plugin loaded');
    },
    buildStart() {
      // Build start hook
      console.log('Build starting...');
    },
    transform(code: string, id: string) {
      // Transform code
      if (id.includes('.reactus.')) {
        return `// Transformed by Reactus\n${code}`;
      }
    },
    generateBundle(options: any, bundle: any) {
      // Generate bundle hook
      console.log('Bundle generated');
    }
  };
}

// Use custom plugin
const server = new Server({
  cwd: process.cwd(),
  plugins: [
    createReactusPlugin({ option: 'value' })
  ]
});

const plugins = await server.resource.plugins();
console.log('Plugins loaded:', plugins.length);
```

### 4.10. Asset Processing

This example shows how to configure custom asset processing rules for different file types. It demonstrates how to organize and optimize assets during the build process.

```typescript
// Configure asset processing
const server = new Server({
  cwd: process.cwd(),
  vite: {
    assetsInclude: ['**/*.md', '**/*.txt'],
    build: {
      assetsDir: 'static',
      rollupOptions: {
        output: {
          assetFileNames: (assetInfo) => {
            const extType = assetInfo.name?.split('.').pop();
            
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType || '')) {
              return 'images/[name]-[hash][extname]';
            }
            
            if (/css/i.test(extType || '')) {
              return 'styles/[name]-[hash][extname]';
            }
            
            if (/js/i.test(extType || '')) {
              return 'scripts/[name]-[hash][extname]';
            }
            
            return 'assets/[name]-[hash][extname]';
          }
        }
      }
    }
  }
});

// Build with custom asset handling
await server.resource.build(server.resource.config);
```

### 4.11. Performance Monitoring

This example demonstrates how to monitor and track Vite performance metrics during development and build processes. The monitoring system provides insights into build times and optimization opportunities.

```typescript
// Monitor Vite performance
class ViteMonitor {
  private buildTimes: number[] = [];
  private devStartTime?: number;
  
  async monitoredBuild(resource: ServerResource) {
    const startTime = Date.now();
    
    try {
      await resource.build(resource.config);
      const buildTime = Date.now() - startTime;
      this.buildTimes.push(buildTime);
      
      console.log(`Build completed in ${buildTime}ms`);
      console.log(`Average build time: ${this.getAverageBuildTime()}ms`);
      
    } catch (error) {
      const failTime = Date.now() - startTime;
      console.error(`Build failed after ${failTime}ms:`, error);
      throw error;
    }
  }
  
  async monitoredDev(resource: ServerResource) {
    this.devStartTime = Date.now();
    
    try {
      const viteServer = await resource.dev();
      const startTime = Date.now() - this.devStartTime;
      
      console.log(`Dev server started in ${startTime}ms`);
      
      // Monitor HMR updates
      viteServer.ws.on('hmr:update', (data) => {
        console.log('HMR update:', data.updates.length, 'files');
      });
      
      return viteServer;
      
    } catch (error) {
      const failTime = Date.now() - this.devStartTime;
      console.error(`Dev server failed after ${failTime}ms:`, error);
      throw error;
    }
  }
  
  private getAverageBuildTime(): number {
    if (this.buildTimes.length === 0) return 0;
    return this.buildTimes.reduce((a, b) => a + b, 0) / this.buildTimes.length;
  }
  
  getStats() {
    return {
      totalBuilds: this.buildTimes.length,
      averageBuildTime: this.getAverageBuildTime(),
      fastestBuild: Math.min(...this.buildTimes),
      slowestBuild: Math.max(...this.buildTimes)
    };
  }
}

// Usage
const monitor = new ViteMonitor();

// Monitor development
const viteServer = await monitor.monitoredDev(server.resource);

// Monitor builds
await monitor.monitoredBuild(server.resource);

console.log('Performance stats:', monitor.getStats());
```

### 4.12. Vite Integration Features

ServerResource provides seamless integration with Vite, offering comprehensive development and build capabilities. This integration enables modern web development workflows while maintaining server-side rendering benefits.

**Development Features**

 - **Development Server**: Hot Module Replacement and fast refresh
 - **Build System**: Production optimization and bundling
 - **Plugin System**: Extensible plugin architecture
 - **Asset Processing**: Image optimization, CSS processing, and more

**Production Features**

 - **Code Splitting**: Automatic chunking for optimal loading
 - **TypeScript Support**: Built-in TypeScript compilation
 - **CSS Preprocessing**: Sass, Less, Stylus support
 - **Import Resolution**: Path aliases and module resolution

### 4.13. Configuration Options

The ServerResource respects all Vite configuration options, providing complete control over the development and build process. This flexibility allows for customization based on project requirements.

**Server Configuration**

 - **Server Options**: Port, host, HTTPS, proxy settings
 - **Build Options**: Output directory, minification, source maps
 - **Plugin Configuration**: Custom plugins and plugin options
 - **Optimization**: Dependency pre-bundling and tree shaking

**Asset Configuration**

 - **CSS Options**: PostCSS, CSS modules, preprocessing
 - **Asset Handling**: Public directory, asset inlining

The ServerResource class provides a bridge between Reactus and Vite, enabling modern development workflows while maintaining the simplicity of server-side rendering.
