# Builder

The Builder class extends Server to provide build functionality for Reactus applications. It handles asset compilation, client bundling, and page generation for production deployments.

This class is designed for build processes and CI/CD pipelines where you need to pre-compile React components, generate optimized assets, and prepare applications for production deployment. It provides comprehensive build methods that work with Vite's build system while adding Reactus-specific functionality.

```typescript
import { Builder } from 'reactus';

const builder = new Builder({
  cwd: process.cwd(),
  basePath: '/',
  production: false
});
```

 1. [Properties](#1-properties)
 2. [Methods](#2-methods)
 3. [Build Results](#3-build-results)
 4. [Usage Examples](#4-usage-examples)
 5. [CI/CD Integration](#5-cicd-integration)
 6. [Error Handling](#6-error-handling)

## 1. Properties

The following properties are available when instantiating a Builder. These properties are inherited from the Server class and provide access to the same internal components with additional build-specific functionality.

| Property | Type | Description |
|----------|------|-------------|
| `loader` | `ServerLoader` | File system loader for resolving and importing modules (inherited) |
| `manifest` | `ServerManifest` | Document manifest for managing page entries (inherited) |
| `production` | `boolean` | Whether the builder is running in production mode (inherited) |
| `resource` | `ServerResource` | Vite integration for asset handling and development (inherited) |
| `vfs` | `VirtualServer` | Virtual file system for in-memory file operations (inherited) |

## 2. Methods

The following methods are available when instantiating a Builder. These methods provide comprehensive build functionality for different types of assets and components in your Reactus application.

### 2.1. Building All Assets

Builds CSS, images, and other static assets for all documents in the manifest. This method processes all asset dependencies and generates optimized bundles for production use.

```typescript
const results = await builder.buildAssets();
console.log(`Built ${results.length} asset bundles`);
```

**Returns**

A promise that resolves to an array of BuildResults containing asset information for all documents.

### 2.2. Building All Client Entries

Builds client-side JavaScript bundles for all documents in the manifest. This method generates the hydration code that makes server-rendered pages interactive in the browser.

```typescript
const results = await builder.buildClients();
console.log(`Built ${results.length} client bundles`);
```

**Returns**

A promise that resolves to an array of BuildResults containing client bundle information for all documents.

### 2.3. Building All Pages

Builds server-side page components for all documents in the manifest. This method generates the server-side rendering code that produces HTML on the server.

```typescript
const results = await builder.buildPages();
console.log(`Built ${results.length} page components`);
```

**Returns**

A promise that resolves to an array of BuildResults containing page component information for all documents.

## 3. Build Results

Each build method returns BuildResults containing comprehensive information about the generated files and their dependencies. Understanding the structure of build results helps with deployment and debugging.

### 3.1. BuildResults Interface

The BuildResults interface provides detailed information about each build operation, including generated files, dependencies, and metadata.

```typescript
interface BuildResults {
  files: string[];        // Generated file paths
  assets: string[];       // Asset dependencies
  imports: string[];      // Import statements
  exports: string[];      // Export statements
  css: string[];          // CSS file paths
}
```

### 3.2. Using Build Results

Build results can be used for deployment automation, cache invalidation, and dependency tracking. Each result provides the information needed to understand what was generated and what dependencies exist.

The results include file paths relative to the configured output directories, making them suitable for deployment scripts and asset management systems.

## 4. Usage Examples

These examples demonstrate common build patterns and use cases for the Builder class. Each example shows different aspects of the build process and how to integrate Builder with various workflows.

### 4.1. Basic Build Process

This example shows a complete build process that compiles all assets, client bundles, and page components for a Reactus application.

```typescript
import { Builder } from 'reactus';

const builder = new Builder({
  cwd: process.cwd(),
  assetPath: './dist/assets',
  clientPath: './dist/client',
  pagePath: './dist/page',
  production: true
});

// Add pages to manifest
await builder.manifest.set('@/pages/home');
await builder.manifest.set('@/pages/about');
await builder.manifest.set('@/pages/contact');

// Build all components
console.log('Building assets...');
await builder.buildAssets();

console.log('Building client bundles...');
await builder.buildClients();

console.log('Building page components...');
await builder.buildPages();

console.log('Build complete!');
```

### 4.2. Build with Custom Vite Configuration

This example demonstrates how to customize the Vite build configuration for advanced optimization and bundling strategies.

```typescript
const builder = new Builder({
  cwd: process.cwd(),
  production: true,
  vite: {
    build: {
      minify: 'terser',
      sourcemap: true,
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

await builder.buildAssets();
```

### 4.3. Incremental Build Process

This example shows how to build specific documents individually, which is useful for incremental builds and development workflows.

```typescript
// Build specific document assets
const document = await builder.manifest.get('@/pages/home');
const assetResults = await document.builder.buildAssets();
const clientResults = await document.builder.buildClient();
const pageResults = await document.builder.buildPage(assetResults);

console.log('Asset files:', assetResults.files);
console.log('Client bundle:', clientResults.files);
console.log('Page component:', pageResults.files);
```

### 4.4. Build with Manifest Persistence

This example demonstrates how to persist and load build manifests for consistent builds across different environments.

```typescript
const builder = new Builder({
  cwd: process.cwd(),
  production: true
});

// Load existing manifest
await builder.manifest.open('./dist/manifest.json');

// Build all documents
await builder.buildAssets();
await builder.buildClients();
await builder.buildPages();

// Save updated manifest
await builder.manifest.save('./dist/manifest.json');
```

### 4.5. Parallel Build Process

This example shows how to run multiple build operations in parallel for improved build performance.

```typescript
const builder = new Builder({
  cwd: process.cwd(),
  production: true
});

// Add documents
await builder.manifest.set('@/pages/home');
await builder.manifest.set('@/pages/about');
await builder.manifest.set('@/pages/contact');

// Build all components in parallel
const [assetResults, clientResults, pageResults] = await Promise.all([
  builder.buildAssets(),
  builder.buildClients(),
  builder.buildPages()
]);

console.log('All builds completed:', {
  assets: assetResults.length,
  clients: clientResults.length,
  pages: pageResults.length
});
```

### 4.6. Build Script Example

This example provides a complete build script suitable for use in package.json scripts or build automation.

```typescript
// scripts/build.ts
import { Builder } from 'reactus';
import { glob } from 'glob';
import path from 'path';

async function buildApp() {
  const builder = new Builder({
    cwd: process.cwd(),
    production: true,
    assetPath: './dist/assets',
    clientPath: './dist/client',
    pagePath: './dist/page'
  });

  // Find all page files
  const pageFiles = await glob('./pages/**/*.{tsx,jsx}');
  
  // Add all pages to manifest
  for (const file of pageFiles) {
    const entry = '@/' + path.relative(process.cwd(), file);
    await builder.manifest.set(entry);
  }

  console.log(`Found ${pageFiles.length} pages to build`);

  // Build all components
  const startTime = Date.now();
  
  await builder.buildAssets();
  await builder.buildClients();
  await builder.buildPages();
  
  const buildTime = Date.now() - startTime;
  console.log(`Build completed in ${buildTime}ms`);

  // Save manifest for production use
  await builder.manifest.save('./dist/manifest.json');
}

buildApp().catch(console.error);
```

## 5. CI/CD Integration

The Builder class is designed to work seamlessly in CI/CD environments with proper error handling, logging, and exit codes. These examples show how to integrate Builder with various CI/CD systems.

### 5.1. Basic CI/CD Build Script

This example provides a CI/CD-ready build script with proper error handling and exit codes for automated deployment pipelines.

```typescript
// ci/build.js
const { Builder } = require('reactus');

const builder = new Builder({
  cwd: process.cwd(),
  production: true,
  assetPath: process.env.ASSET_PATH || './dist/assets',
  clientPath: process.env.CLIENT_PATH || './dist/client',
  pagePath: process.env.PAGE_PATH || './dist/page'
});

// Build process suitable for CI/CD
async function cicdBuild() {
  try {
    await builder.buildAssets();
    await builder.buildClients();
    await builder.buildPages();
    
    console.log('✓ Build successful');
    process.exit(0);
  } catch (error) {
    console.error('✗ Build failed:', error.message);
    process.exit(1);
  }
}

cicdBuild();
```

### 5.2. Environment-Specific Configuration

This example shows how to configure Builder for different environments using environment variables and configuration files.

```typescript
const builder = new Builder({
  cwd: process.cwd(),
  production: process.env.NODE_ENV === 'production',
  assetPath: process.env.ASSET_OUTPUT_PATH,
  clientPath: process.env.CLIENT_OUTPUT_PATH,
  pagePath: process.env.PAGE_OUTPUT_PATH,
  vite: {
    build: {
      minify: process.env.NODE_ENV === 'production' ? 'terser' : false,
      sourcemap: process.env.GENERATE_SOURCEMAP === 'true'
    }
  }
});
```

## 6. Error Handling

The Builder class provides comprehensive error handling for build operations. Understanding common error patterns helps with debugging and maintaining reliable build processes.

### 6.1. Common Build Errors

Build operations can fail for various reasons including missing files, configuration errors, and dependency issues. Proper error handling ensures reliable builds.

```typescript
const builder = new Builder({
  cwd: process.cwd(),
  production: true
});

try {
  // Add documents to manifest
  await builder.manifest.set('@/pages/home');
  await builder.manifest.set('@/pages/about');

  // Build with error handling
  const assetResults = await builder.buildAssets();
  console.log(`✓ Built ${assetResults.length} asset bundles`);

  const clientResults = await builder.buildClients();
  console.log(`✓ Built ${clientResults.length} client bundles`);

  const pageResults = await builder.buildPages();
  console.log(`✓ Built ${pageResults.length} page components`);

} catch (error) {
  console.error('Build failed:', error.message);
  
  if (error.message.includes('Vite build failed')) {
    console.error('Check your Vite configuration and dependencies');
  } else if (error.message.includes('Document not found')) {
    console.error('Check that all page files exist');
  }
  
  process.exit(1);
}
```

### 6.2. Build Validation

Validate build results to ensure all expected files were generated and meet quality requirements.

```typescript
async function validateBuild(results) {
  for (const result of results) {
    if (result.files.length === 0) {
      throw new Error('Build produced no output files');
    }
    
    // Validate file existence
    for (const file of result.files) {
      if (!await fs.pathExists(file)) {
        throw new Error(`Expected build output not found: ${file}`);
      }
    }
  }
  
  console.log('✓ Build validation passed');
}
