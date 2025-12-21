# Configuration Options

Reactus provides flexible configuration options for different modes of operation. This document details all available configuration options across development, build, production, and server configurations, helping you customize the framework's behavior for your specific needs.

Understanding the configuration system is essential for optimizing Reactus for your development workflow and production environment. Each configuration type is designed for specific use cases and includes sensible defaults while providing the flexibility to customize every aspect of the framework's behavior.

 1. [Configuration Types](#1-configuration-types)
 2. [Complete Configuration Reference](#2-complete-configuration-reference)
 3. [Configuration by Mode](#3-configuration-by-mode)
 4. [Configuration Details](#4-configuration-details)
 5. [Configuration Examples](#5-configuration-examples)
 6. [Best Practices](#6-best-practices)

## 1. Configuration Types

Reactus uses different configuration types depending on the mode of operation. Each configuration type is optimized for its specific use case and includes only the necessary options for that particular mode.

### 1.1. Development Configuration

Used in development mode with the `dev()` function for hot module replacement and rapid iteration. This configuration includes options for Vite integration, watch mode, and development-specific optimizations.

Development configuration focuses on developer experience with fast rebuilds, hot module replacement, and comprehensive error reporting. It includes additional debugging options and development-specific plugins.

### 1.2. Build Configuration

Used in build mode with the `build()` function for compiling assets and generating production-ready files. This configuration includes options for output paths, optimization settings, and build-specific plugins.

Build configuration emphasizes performance optimization, bundle splitting, and asset generation. It includes settings for code splitting, minification, and production-ready output generation.

### 1.3. Production Configuration

Used in production mode with the `serve()` function for serving pre-built pages and assets. This configuration includes options for serving static files and runtime optimization.

Production configuration focuses on runtime performance with minimal overhead and optimized asset serving. It includes only the essential options needed for serving pre-built applications.

### 1.4. Engine Configuration

Internal unified configuration that combines all options from other configuration types. This configuration is used internally by Reactus and includes all possible options across all modes.

Engine configuration provides a complete interface for advanced use cases and internal framework operations. It serves as the foundation for all other configuration types.

## 2. Complete Configuration Reference

The following table provides a comprehensive reference of all configuration options available across different modes. Each option includes its type, requirement status, default value, and detailed description.

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `assetPath` | `string` | Yes* | N/A | Path where to save assets (CSS, images, etc). Used in build and server configs. |
| `basePath` | `string` | Yes | `'/'` | Base path used in Vite for routing and asset resolution. |
| `clientPath` | `string` | Yes* | N/A | Path where to save the client scripts (JS). Used in build and server configs. |
| `clientRoute` | `string` | Yes | `'/client'` | Client script route prefix used in document markup. Example: `/client/[id][extname]` |
| `clientTemplate` | `string` | Yes | Default template | Template wrapper for the client script (TSX). Defines how client-side code is wrapped. |
| `cssFiles` | `string[]` | No | `undefined` | Array of filepaths to global CSS files to include in all pages. |
| `cssRoute` | `string` | Yes* | N/A | Style route prefix used in document markup. Example: `/assets/[id][extname]`. Used in production and server configs. |
| `cwd` | `string` | Yes | `process.cwd()` | Current working directory. Base directory for resolving relative paths. |
| `documentTemplate` | `string` | Yes | Default template | Template wrapper for the document markup (HTML). Defines the overall HTML structure. |
| `fs` | `FileSystem` | No | Node.js fs | File system interface for custom file operations. Useful for testing or custom environments. |
| `optimizeDeps` | `DepOptimizationOptions` | No | `undefined` | Vite dependency optimization settings. Controls how dependencies are pre-bundled. |
| `pagePath` | `string` | Yes* | N/A | Path where to save and load the server script (JS). Used in build, production, and server configs. |
| `pageTemplate` | `string` | Yes* | Default template | Template wrapper for the page script (TSX). Used in build and server configs. |
| `plugins` | `PluginOption[]` | Yes | `[]` | Array of Vite plugins to use during development and build processes. |
| `production` | `boolean` | Yes* | N/A | Flag that directs resolvers and markup generator behavior. Used in server config. |
| `vite` | `ViteConfig` | No | `undefined` | Original Vite options that override other Vite-related settings. |
| `watchIgnore` | `string[]` | No | `undefined` | Array of file patterns to ignore in watch mode during development. |

*Required only in specific configuration types

## 3. Configuration by Mode

Each mode of operation uses a specific subset of configuration options optimized for its use case. Understanding which options are available and required for each mode helps you configure Reactus correctly for your specific needs.

### 3.1. Development Configuration

Used with `dev()` function for development mode with hot module replacement and live reloading. This configuration provides the fastest development experience with comprehensive debugging support.

```typescript
import { dev } from 'reactus';

const engine = dev({
  cwd: process.cwd(),
  basePath: '/',
  clientRoute: '/client',
  clientTemplate: 'export default function Client() { return <div>Client</div>; }',
  cssFiles: ['./styles/global.css'],
  documentTemplate: '<!DOCTYPE html><html><head></head><body>{children}</body></html>',
  plugins: [
    // Vite plugins
  ],
  optimizeDeps: {
    include: ['react', 'react-dom']
  },
  vite: {
    // Custom Vite configuration
  },
  watchIgnore: ['node_modules/**', 'dist/**']
});
```

**Required fields:** `basePath`, `clientRoute`, `clientTemplate`, `cwd`, `documentTemplate`, `plugins`

### 3.2. Build Configuration

Used with `build()` function for building assets and pages for production deployment. This configuration focuses on optimization and efficient asset generation.

```typescript
import { build } from 'reactus';

const builder = build({
  cwd: process.cwd(),
  assetPath: './dist/assets',
  basePath: '/',
  clientPath: './dist/client',
  clientTemplate: 'export default function Client() { return <div>Client</div>; }',
  cssFiles: ['./styles/global.css'],
  pagePath: './dist/pages',
  pageTemplate: 'export default function Page() { return <div>Page</div>; }',
  plugins: [
    // Vite plugins
  ],
  optimizeDeps: {
    include: ['react', 'react-dom']
  }
});
```

**Required fields:** `assetPath`, `basePath`, `clientPath`, `clientTemplate`, `cwd`, `pagePath`, `pageTemplate`, `plugins`

### 3.3. Production Configuration

Used with `serve()` function for serving pre-built pages in production environments. This configuration is optimized for runtime performance with minimal overhead.

```typescript
import { serve } from 'reactus';

const server = serve({
  cwd: process.cwd(),
  clientRoute: '/client',
  cssRoute: '/assets',
  documentTemplate: '<!DOCTYPE html><html><head></head><body>{children}</body></html>',
  pagePath: './dist/pages',
  plugins: [
    // Vite plugins (minimal for production)
  ]
});
```

**Required fields:** `clientRoute`, `cssRoute`, `cwd`, `documentTemplate`, `pagePath`, `plugins`

### 3.4. Engine Configuration

Internal unified configuration that combines all options from other configuration types. This configuration is used internally by Reactus for advanced use cases and framework operations.

```typescript
// This is used internally by Reactus
const engineConfig: EngineConfig = {
  // All options from above configurations
  production: true, // or false
  // ... other options
};
```

## 4. Configuration Details

Understanding the purpose and usage of each configuration category helps you make informed decisions when setting up Reactus for your specific requirements. Each category serves a distinct purpose in the framework's operation.

### 4.1. Path Configuration

Path configuration options define where files are located and where build outputs should be saved. These paths form the foundation of the framework's file system operations.

 - **`cwd`**: The working directory for resolving all relative paths
 - **`basePath`**: Used by Vite for routing, typically `'/'` for root
 - **`assetPath`**: Where built CSS, images, and other assets are saved
 - **`clientPath`**: Where built client-side JavaScript is saved
 - **`pagePath`**: Where built server-side page scripts are saved

### 4.2. Route Configuration

Route configuration options define URL patterns for serving different types of assets. These routes determine how assets are accessed by browsers and CDNs.

 - **`clientRoute`**: URL prefix for client scripts (e.g., `/client/abc123.js`)
 - **`cssRoute`**: URL prefix for CSS assets (e.g., `/assets/styles.css`)

### 4.3. Template Configuration

Template configuration options define how code is wrapped and structured. Templates provide the scaffolding for different types of generated code.

Templates define how code is wrapped and provide the structure for generated files:

 - **`clientTemplate`**: Wraps client-side React components
 - **`pageTemplate`**: Wraps server-side page components
 - **`documentTemplate`**: Defines the HTML document structure

### 4.4. Plugin Configuration

Plugin configuration options control Vite integration and build optimization. These options allow you to extend Reactus with additional functionality and optimizations.

 - **`plugins`**: Array of Vite plugins for processing files
 - **`optimizeDeps`**: Vite dependency optimization settings
 - **`vite`**: Direct Vite configuration (overrides other settings)

### 4.5. File System Configuration

File system configuration options control how Reactus interacts with files and handles global resources. These options provide flexibility for different deployment environments.

 - **`fs`**: Custom file system interface (defaults to Node.js fs)
 - **`cssFiles`**: Global CSS files to include
 - **`watchIgnore`**: Files to ignore during development watch mode

## 5. Configuration Examples

These examples demonstrate common configuration patterns and best practices for different use cases. Each example includes explanations of why specific options are chosen and how they work together.

### 5.1. Basic Development Setup

This example shows a minimal development configuration suitable for most projects. It includes the essential options needed for development with hot module replacement.

```typescript
const config = {
  cwd: process.cwd(),
  basePath: '/',
  clientRoute: '/client',
  clientTemplate: `
    import React from 'react';
    import { hydrateRoot } from 'react-dom/client';
    import Component from '{COMPONENT}';
    
    hydrateRoot(document.getElementById('root'), <Component {...{PROPS}} />);
  `,
  documentTemplate: `
    <!DOCTYPE html>
    <html>
      <head>{HEAD}</head>
      <body>
        <div id="root">{CHILDREN}</div>
        {SCRIPTS}
      </body>
    </html>
  `,
  plugins: []
};
```

### 5.2. Production Build Setup

This example demonstrates a production build configuration with optimization settings and proper output paths. It includes settings for performance optimization and asset organization.

```typescript
const buildConfig = {
  cwd: process.cwd(),
  assetPath: './dist/public/assets',
  basePath: '/',
  clientPath: './dist/public/client',
  clientTemplate: '/* client template */',
  pagePath: './dist/server/pages',
  pageTemplate: '/* page template */',
  plugins: [
    // Production optimizations
  ]
};
```

### 5.3. Custom File System

This example shows how to use a custom file system interface for testing or specialized deployment environments. Custom file systems enable advanced use cases like in-memory operations.

```typescript
import { MemoryFileSystem } from 'custom-fs';

const config = {
  // ... other options
  fs: new MemoryFileSystem(),
  cwd: '/virtual'
};
```

### 5.4. Advanced Vite Integration

This example demonstrates advanced Vite configuration with custom plugins and optimization settings. It shows how to leverage Vite's full feature set within Reactus.

```typescript
const config = {
  cwd: process.cwd(),
  basePath: '/',
  clientRoute: '/client',
  plugins: [
    // Custom Vite plugins
  ],
  vite: {
    define: { __DEV__: true },
    server: { port: 3000 },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom']
          }
        }
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
    exclude: ['some-esm-package']
  }
};
```

## 6. Best Practices

Following these best practices ensures optimal performance, maintainability, and reliability when configuring Reactus for your projects. These recommendations are based on real-world usage patterns and common pitfalls.

### 6.1. Path Management

Use absolute paths for `cwd` to avoid resolution issues and ensure consistent behavior across different environments. Organize output paths logically to separate different types of assets and make deployment easier.

 - Use absolute paths for `cwd` to avoid resolution issues
 - Organize output paths logically to separate different types of assets
 - Keep build outputs separate from source code
 - Use consistent naming conventions for output directories

### 6.2. Template Configuration

Keep templates simple and focused on their specific purpose. Avoid complex logic in templates and use them primarily for structural concerns rather than business logic.

 - Keep templates simple and focused on their specific purpose
 - Avoid complex logic in templates
 - Use consistent placeholder naming conventions
 - Test templates with different content types

### 6.3. Plugin Management

Include necessary plugins for your build requirements but avoid over-engineering with unnecessary plugins. Configure plugins appropriately for each mode to optimize performance.

 - Include necessary plugins for your build requirements
 - Configure plugins appropriately for each mode
 - Use `optimizeDeps` to pre-bundle heavy dependencies
 - Test plugin interactions in different environments

### 6.4. Performance Optimization

Set appropriate `watchIgnore` patterns to improve development performance by excluding unnecessary files from the watch process. Use `optimizeDeps` to pre-bundle dependencies and reduce development server startup time.

 - Set appropriate `watchIgnore` patterns to improve performance
 - Use `optimizeDeps` to pre-bundle heavy dependencies
 - Configure routes to match your server setup
 - Monitor build times and optimize accordingly

### 6.5. Environment-Specific Configuration

Test configurations in both development and production modes to ensure consistency. Use environment variables for configuration values that change between environments.

 - Test configurations in both development and production modes
 - Use environment variables for environment-specific values
 - Maintain separate configuration files for different environments
 - Document configuration decisions and their rationale
