# Document

The Document class represents a single page or component entry in the Reactus system. It manages the file path, provides access to building, loading, and rendering capabilities for individual documents.

This class serves as the central coordination point for all document-related operations, providing a unified interface for working with individual pages or components. Each Document instance encapsulates the complete lifecycle of a page from file loading through rendering, making it easy to manage complex applications with multiple pages.

```typescript
import { Document } from 'reactus';

// Documents are typically created through ServerManifest
const document = await server.manifest.get('@/pages/home');
```

 1. [Properties](#1-properties)
 2. [Getting Document ID](#2-getting-document-id)
 3. [Document Operations](#3-document-operations)
 4. [Usage Examples](#4-usage-examples)
 5. [Error Handling](#5-error-handling)
 6. [Integration Examples](#6-integration-examples)

## 1. Properties

The following properties are available when instantiating a Document. These properties provide access to the various subsystems that handle different aspects of document processing and rendering.

| Property | Type | Description |
|----------|------|-------------|
| `builder` | `DocumentBuilder` | Builder instance for compiling assets, clients, and pages |
| `entry` | `string` | The entry path for this document (e.g., '@/pages/home') |
| `loader` | `DocumentLoader` | Loader instance for file system operations and imports |
| `render` | `DocumentRender` | Renderer instance for generating HTML markup |
| `server` | `Server` | Reference to the parent server instance |

## 2. Getting Document ID

Returns a unique identifier for the document based on its entry path. This ID is used internally for caching, asset management, and tracking document state across the system.

```typescript
const document = await server.manifest.get('@/pages/home');
const id = document.id;
console.log(id); // Generated hash based on entry path
```

**Returns**

A unique string identifier for the document based on its entry path.

## 3. Document Operations

Document operations encompass the complete lifecycle of a page from file loading through rendering. Understanding these operations helps you work effectively with the Document class in different scenarios.

### 3.1. Building Operations

Building operations compile assets, generate client bundles, and prepare server-side components. These operations are typically performed during development or as part of a build process.

Building operations include asset compilation for CSS and static files, client bundle generation for browser hydration, and server-side component preparation for rendering.

### 3.2. Loading Operations

Loading operations handle file system access, module imports, and path resolution. These operations provide the foundation for accessing document files and their dependencies.

Loading operations include absolute path resolution, component importing, and relative path calculation for cross-references between files.

### 3.3. Rendering Operations

Rendering operations generate HTML markup, inject client scripts, and handle server-side rendering. These operations produce the final output that gets sent to browsers.

Rendering operations include complete HTML generation, HMR client injection for development, and prop serialization for client-side hydration.

## 4. Usage Examples

These examples demonstrate common patterns and use cases for working with Document instances. Each example shows different aspects of document processing and integration.

### 4.1. Basic Document Operations

This example shows how to access document properties and perform basic operations with a Document instance.

```typescript
import { dev } from 'reactus';

const engine = dev({
  cwd: process.cwd(),
  basePath: '/',
  clientRoute: '/client'
});

// Get a document from the manifest
const document = await engine.get('@/pages/home');

// Access document properties
console.log('Entry:', document.entry);
console.log('ID:', document.id);
console.log('Server:', document.server.production);
```

### 4.2. Building Document Assets

This example demonstrates how to build different types of assets for a document, including CSS, client bundles, and server-side components.

```typescript
// Build assets for a specific document
const assetResults = await document.builder.buildAssets();
console.log('Asset files:', assetResults.files);

// Build client bundle
const clientResults = await document.builder.buildClient();
console.log('Client bundle:', clientResults.files);

// Build page component
const pageResults = await document.builder.buildPage(assetResults);
console.log('Page component:', pageResults.files);
```

### 4.3. Loading Document Files

This example shows how to use the document loader for file system operations and component imports.

```typescript
// Get absolute path to the document file
const absolutePath = await document.loader.absolute();
console.log('File path:', absolutePath);

// Import the document component
const component = await document.loader.import();
console.log('Component:', component.default);

// Get relative path from another file
const relativePath = document.loader.relative('/src/components/Header.tsx');
console.log('Relative path:', relativePath);
```

### 4.4. Rendering Document Markup

This example demonstrates how to render complete HTML markup and handle development-specific features like HMR.

```typescript
// Render complete HTML markup
const html = await document.render.renderMarkup({
  title: 'Home Page',
  user: { name: 'John', email: 'john@example.com' }
});

// Render HMR client for development
const hmrClient = await document.render.renderHMRClient();
console.log('HMR script:', hmrClient);
```

### 4.5. Document Lifecycle Management

This example shows a complete document processing workflow that handles the entire lifecycle from loading to rendering.

```typescript
// Complete document processing workflow
async function processDocument(entry: string) {
  // 1. Get document from manifest
  const document = await server.manifest.get(entry);
  
  // 2. Build assets if needed
  if (!server.production) {
    await document.builder.buildAssets();
  }
  
  // 3. Import component
  const component = await document.loader.import();
  
  // 4. Render with props
  const html = await document.render.renderMarkup({
    timestamp: Date.now(),
    environment: server.production ? 'production' : 'development'
  });
  
  return {
    id: document.id,
    entry: document.entry,
    component,
    html
  };
}

// Process multiple documents
const results = await Promise.all([
  processDocument('@/pages/home'),
  processDocument('@/pages/about'),
  processDocument('@/pages/contact')
]);
```

### 4.6. Development vs Production Handling

This example demonstrates how to handle documents differently in development and production environments.

```typescript
const document = await server.manifest.get('@/pages/home');

if (server.production) {
  // In production, use pre-built assets
  const html = await document.render.renderMarkup(props);
  
} else {
  // In development, build on-demand and include HMR
  await document.builder.buildAssets();
  const html = await document.render.renderMarkup(props);
  const hmr = await document.render.renderHMRClient();
}
```

## 5. Error Handling

The Document class provides comprehensive error handling for various failure scenarios. Understanding common error patterns helps with debugging and maintaining reliable applications.

### 5.1. Common Error Patterns

Document operations can fail for various reasons including missing files, compilation errors, and rendering issues. Proper error handling ensures graceful degradation and helpful debugging information.

```typescript
try {
  const document = await server.manifest.get('@/pages/nonexistent');
  const html = await document.render.renderMarkup();
} catch (error) {
  if (error.message.includes('Document not found')) {
    console.error('Page does not exist');
  } else if (error.message.includes('Render failed')) {
    console.error('Component rendering failed');
  } else {
    console.error('Unknown error:', error);
  }
}
```

### 5.2. Custom Error Handling

This example shows how to implement custom error handling and recovery strategies for document processing.

```typescript
// Create a custom document processor
class DocumentProcessor {
  constructor(private document: Document) {}
  
  async process(props: any = {}) {
    const startTime = Date.now();
    
    try {
      // Build if in development
      if (!this.document.server.production) {
        await this.document.builder.buildAssets();
        await this.document.builder.buildClient();
      }
      
      // Render markup
      const html = await this.document.render.renderMarkup(props);
      
      const processingTime = Date.now() - startTime;
      
      return {
        success: true,
        html,
        processingTime,
        entry: this.document.entry,
        id: this.document.id
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        processingTime: Date.now() - startTime,
        entry: this.document.entry
      };
    }
  }
}

// Usage
const document = await server.manifest.get('@/pages/home');
const processor = new DocumentProcessor(document);
const result = await processor.process({ title: 'Home' });

if (result.success) {
  console.log(`Rendered in ${result.processingTime}ms`);
} else {
  console.error(`Failed: ${result.error}`);
}
```

## 6. Integration Examples

These examples demonstrate how to integrate Document instances with other parts of your application and handle complex scenarios like batch processing and performance optimization.

### 6.1. Batch Document Operations

This example shows how to process multiple documents efficiently using parallel operations and proper resource management.

```typescript
// Process multiple documents in parallel
async function batchProcess(entries: string[], props: any = {}) {
  const documents = await Promise.all(
    entries.map(entry => server.manifest.get(entry))
  );
  
  // Build all assets in parallel (development only)
  if (!server.production) {
    await Promise.all(
      documents.map(doc => doc.builder.buildAssets())
    );
  }
  
  // Render all documents
  const results = await Promise.all(
    documents.map(async (doc) => ({
      entry: doc.entry,
      id: doc.id,
      html: await doc.render.renderMarkup(props)
    }))
  );
  
  return results;
}

// Usage
const pages = [
  '@/pages/home',
  '@/pages/about',
  '@/pages/contact'
];

const renderedPages = await batchProcess(pages, {
  siteName: 'My Website',
  year: new Date().getFullYear()
});
```

### 6.2. Component Integration

The Document class serves as the central coordination point for all document-related operations, integrating seamlessly with other Reactus components.

Each Document instance provides a cohesive interface for working with individual pages or components in the Reactus system:

 - **DocumentBuilder**: Handles compilation and bundling operations
 - **DocumentLoader**: Manages file system operations and imports
 - **DocumentRender**: Generates HTML output and handles rendering
 - **Server**: Provides configuration and environmental context
 - **ServerManifest**: Manages document lifecycle and caching
