# DocumentBuilder

The DocumentBuilder class handles the compilation and bundling of individual documents. It provides methods to build assets, client-side JavaScript, and server-side page components using Vite's build system.

This class is responsible for transforming React components and their dependencies into optimized bundles for both server-side rendering and client-side hydration. It integrates deeply with Vite's build system to provide fast, efficient compilation with support for modern JavaScript features, CSS processing, and asset optimization.

```typescript
import { DocumentBuilder } from 'reactus';

// DocumentBuilder is typically accessed through a Document instance
const document = await server.manifest.get('@/pages/home');
const builder = document.builder;
```

 1. [Properties](#1-properties)
 2. [Methods](#2-methods)
 3. [Build Results Structure](#3-build-results-structure)
 4. [Usage Examples](#4-usage-examples)
 5. [Build Optimization](#5-build-optimization)
 6. [Vite Integration](#6-vite-integration)

## 1. Properties

The following properties are available when instantiating a DocumentBuilder. These properties provide access to the parent document and its associated configuration and context.

| Property | Type | Description |
|----------|------|-------------|
| `document` | `Document` | Reference to the parent document instance |

## 2. Methods

The following methods are available when instantiating a DocumentBuilder. These methods provide comprehensive build functionality for different types of assets and components in your document.

### 2.1. Building Assets

Builds CSS, images, and other static assets for the document. This method processes all asset dependencies and generates optimized bundles with proper hashing and compression for production use.

```typescript
const assetResults = await builder.buildAssets();
console.log('Built assets:', assetResults.files);
console.log('CSS files:', assetResults.css);
```

**Returns**

A promise that resolves to BuildResults containing information about generated asset files.

### 2.2. Building Client Bundle

Builds the client-side JavaScript bundle that handles hydration and interactivity in the browser. This method generates the code needed to make server-rendered pages interactive on the client side.

```typescript
const clientResults = await builder.buildClient();
console.log('Client bundle:', clientResults.files);
console.log('Imports:', clientResults.imports);
```

**Returns**

A promise that resolves to BuildResults containing information about the client bundle.

### 2.3. Building Page Component

Builds the server-side page component that generates HTML during server-side rendering. This method creates the optimized server-side code needed to render the component with props.

```typescript
const assetResults = await builder.buildAssets();
const pageResults = await builder.buildPage(assetResults);
console.log('Page component:', pageResults.files);
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `assets` | `BuildResults` | Optional asset build results to include in the page build |

**Returns**

A promise that resolves to BuildResults containing information about the page component.

## 3. Build Results Structure

The BuildResults interface contains comprehensive information about generated files and their dependencies. Understanding this structure helps with deployment automation, cache invalidation, and dependency tracking.

### 3.1. BuildResults Interface

The BuildResults interface provides detailed information about each build operation, including file paths, dependencies, and metadata that can be used for optimization and deployment.

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

Build results provide the information needed for deployment scripts, asset management systems, and performance optimization. Each result includes file paths relative to the configured output directories.

The results can be used for cache invalidation strategies, CDN uploads, and dependency analysis to optimize loading performance and manage asset lifecycles effectively.

## 4. Usage Examples

These examples demonstrate common build patterns and use cases for the DocumentBuilder class. Each example shows different aspects of the build process and how to handle various scenarios.

### 4.1. Basic Build Process

This example shows a complete build process that compiles all components for a document in the correct order.

```typescript
const document = await server.manifest.get('@/pages/home');
const builder = document.builder;

// Build all components for a document
async function buildDocument() {
  console.log('Building assets...');
  const assetResults = await builder.buildAssets();
  
  console.log('Building client bundle...');
  const clientResults = await builder.buildClient();
  
  console.log('Building page component...');
  const pageResults = await builder.buildPage(assetResults);
  
  return {
    assets: assetResults,
    client: clientResults,
    page: pageResults
  };
}

const results = await buildDocument();
console.log('Build complete:', results);
```

### 4.2. Development vs Production Builds

This example demonstrates how build behavior differs between development and production environments, with different optimization levels and debugging features.

```typescript
// Build for development with source maps and debugging
const document = await server.manifest.get('@/pages/home');

if (!server.production) {
  // In development, build on-demand
  const assetResults = await document.builder.buildAssets();
  
  // Assets include source maps and are not minified
  console.log('Development assets:', assetResults.files);
  console.log('Source maps available:', assetResults.files.some(f => f.endsWith('.map')));
} else {
  // Build for production with optimization
  const assetResults = await document.builder.buildAssets();
  const clientResults = await document.builder.buildClient();
  const pageResults = await document.builder.buildPage(assetResults);
  
  console.log('Production build complete');
  console.log('Asset files:', assetResults.files.length);
  console.log('Client size:', clientResults.files.length);
}
```

### 4.3. Error Handling

This example shows how to handle common build errors and implement proper error recovery strategies.

```typescript
const document = await server.manifest.get('@/pages/home');

try {
  const assetResults = await document.builder.buildAssets();
  console.log('Assets built successfully');
} catch (error) {
  if (error.message.includes('Vite build failed')) {
    console.error('Build configuration error:', error);
  } else if (error.message.includes('Module not found')) {
    console.error('Missing dependency:', error);
  } else {
    console.error('Unknown build error:', error);
  }
}
```

### 4.4. Incremental Building

This example demonstrates how to implement incremental builds that only rebuild components when necessary, improving build performance.

```typescript
// Build only what's needed based on conditions
async function incrementalBuild(document: Document, force = false) {
  const results: any = {};
  
  // Check if assets need rebuilding
  const assetPath = `${server.paths.asset}/${document.id}.js`;
  const assetExists = await fs.access(assetPath).then(() => true).catch(() => false);
  
  if (!assetExists || force) {
    console.log('Building assets...');
    results.assets = await document.builder.buildAssets();
  } else {
    console.log('Assets up to date');
  }
  
  // Check if client bundle needs rebuilding
  const clientPath = `${server.paths.client}/${document.id}.js`;
  const clientExists = await fs.access(clientPath).then(() => true).catch(() => false);
  
  if (!clientExists || force) {
    console.log('Building client...');
    results.client = await document.builder.buildClient();
  } else {
    console.log('Client up to date');
  }
  
  // Always build page component (it's fast)
  results.page = await document.builder.buildPage(results.assets);
  
  return results;
}

const document = await server.manifest.get('@/pages/home');
const results = await incrementalBuild(document);
```

### 4.5. Parallel Building

This example shows how to build multiple documents in parallel for improved performance in batch operations.

```typescript
// Build multiple documents in parallel
async function buildMultipleDocuments(entries: string[]) {
  const documents = await Promise.all(
    entries.map(entry => server.manifest.get(entry))
  );
  
  // Build all assets in parallel
  const assetResults = await Promise.all(
    documents.map(doc => doc.builder.buildAssets())
  );
  
  // Build all client bundles in parallel
  const clientResults = await Promise.all(
    documents.map(doc => doc.builder.buildClient())
  );
  
  // Build all page components in parallel
  const pageResults = await Promise.all(
    documents.map((doc, index) => 
      doc.builder.buildPage(assetResults[index])
    )
  );
  
  return documents.map((doc, index) => ({
    entry: doc.entry,
    assets: assetResults[index],
    client: clientResults[index],
    page: pageResults[index]
  }));
}

const entries = ['@/pages/home', '@/pages/about', '@/pages/contact'];
const results = await buildMultipleDocuments(entries);
console.log(`Built ${results.length} documents`);
```

### 4.6. Build Result Analysis

This example demonstrates how to analyze build results for optimization opportunities and potential issues.

```typescript
// Analyze build results for optimization
async function analyzeBuild(document: Document) {
  const assetResults = await document.builder.buildAssets();
  const clientResults = await document.builder.buildClient();
  const pageResults = await document.builder.buildPage(assetResults);
  
  const analysis = {
    entry: document.entry,
    totalFiles: [
      ...assetResults.files,
      ...clientResults.files,
      ...pageResults.files
    ].length,
    assetCount: assetResults.files.length,
    clientCount: clientResults.files.length,
    pageCount: pageResults.files.length,
    cssFiles: assetResults.css?.length || 0,
    imports: clientResults.imports?.length || 0,
    exports: pageResults.exports?.length || 0
  };
  
  console.log('Build Analysis:', analysis);
  
  // Check for potential issues
  if (analysis.assetCount > 10) {
    console.warn('High number of asset files, consider bundling');
  }
  
  if (analysis.cssFiles > 5) {
    console.warn('Many CSS files, consider consolidation');
  }
  
  return analysis;
}

const document = await server.manifest.get('@/pages/home');
const analysis = await analyzeBuild(document);
```

## 5. Build Optimization

Build optimization techniques help improve performance, reduce bundle sizes, and enhance the development experience. Understanding these techniques is essential for production deployments.

### 5.1. Build Caching

Implement caching strategies to avoid unnecessary rebuilds and improve build performance during development and CI/CD processes.

```typescript
// Simple build caching mechanism
class BuildCache {
  private cache = new Map<string, any>();
  
  async buildWithCache(document: Document, type: 'assets' | 'client' | 'page') {
    const cacheKey = `${document.id}-${type}`;
    
    if (this.cache.has(cacheKey)) {
      console.log(`Using cached ${type} for ${document.entry}`);
      return this.cache.get(cacheKey);
    }
    
    let result;
    switch (type) {
      case 'assets':
        result = await document.builder.buildAssets();
        break;
      case 'client':
        result = await document.builder.buildClient();
        break;
      case 'page':
        const assets = this.cache.get(`${document.id}-assets`);
        result = await document.builder.buildPage(assets);
        break;
    }
    
    this.cache.set(cacheKey, result);
    return result;
  }
  
  clearCache(documentId?: string) {
    if (documentId) {
      for (const key of this.cache.keys()) {
        if (key.startsWith(documentId)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }
}

// Usage
const cache = new BuildCache();
const document = await server.manifest.get('@/pages/home');

const assets = await cache.buildWithCache(document, 'assets');
const client = await cache.buildWithCache(document, 'client');
const page = await cache.buildWithCache(document, 'page');
```

### 5.2. Custom Build Configuration

Configure Vite build options through the Server configuration to optimize builds for your specific requirements and deployment environment.

```typescript
// The DocumentBuilder uses the server's Vite configuration
const server = new Server({
  cwd: process.cwd(),
  production: true,
  vite: {
    build: {
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

const document = await server.manifest.get('@/pages/home');
const results = await document.builder.buildAssets();
// Uses the custom Vite configuration above
```

## 6. Vite Integration

DocumentBuilder leverages Vite's build system to provide modern, efficient compilation with comprehensive feature support. Understanding this integration helps you make the most of the build system's capabilities.

### 6.1. Vite Features

The builder integrates with Vite to provide comprehensive build capabilities that handle modern web development requirements.

DocumentBuilder leverages Vite's build system for:

 - **Asset Processing**: Images, fonts, and other static assets
 - **Code Splitting**: Automatic chunking for optimal loading
 - **Tree Shaking**: Dead code elimination
 - **Minification**: Code compression for production
 - **Source Maps**: Debugging support in development

### 6.2. Configuration Integration

The builder respects all Vite configuration options passed to the Server instance, allowing for complete customization of the build process. This includes plugin configuration, optimization settings, and output formatting.

All Vite plugins and configuration options are fully supported, enabling you to use the entire Vite ecosystem while benefiting from Reactus's server-side rendering and hydration capabilities.
