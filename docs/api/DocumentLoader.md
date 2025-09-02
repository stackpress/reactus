# DocumentLoader

The DocumentLoader class handles file system operations and module loading for individual documents. It provides methods to resolve file paths, import components, and manage module dependencies.

This class serves as the bridge between the file system and the Reactus framework, providing a consistent interface for loading React components regardless of the underlying file system implementation. It handles path resolution, module importing, and dependency management with support for modern JavaScript features and development tools.

```typescript
import { DocumentLoader } from 'reactus';

// DocumentLoader is typically accessed through a Document instance
const document = await server.manifest.get('@/pages/home');
const loader = document.loader;
```

 1. [Properties](#1-properties)
 2. [Methods](#2-methods)
 3. [File System Integration](#3-file-system-integration)
 4. [Usage Examples](#4-usage-examples)
 5. [Error Handling](#5-error-handling)
 6. [Advanced Features](#6-advanced-features)

## 1. Properties

The following properties are available when instantiating a DocumentLoader. These properties provide access to the parent document and its associated configuration and context.

| Property | Type | Description |
|----------|------|-------------|
| `document` | `Document` | Reference to the parent document instance |

## 2. Methods

The following methods are available when instantiating a DocumentLoader. These methods provide comprehensive file system operations and module loading functionality for document management.

### 2.1. Getting Absolute Path

Returns the absolute file path for the document in the file system. This method resolves the document's entry path to a complete file system path that can be used for file operations.

```typescript
const absolutePath = await loader.absolute();
console.log('File path:', absolutePath);
// Output: /project/pages/home.tsx
```

**Returns**

A promise that resolves to the absolute file path of the document.

### 2.2. Importing Document Component

Imports the document's React component and all its exports. This method handles module loading with support for both CommonJS and ES modules, providing access to the default export and named exports.

```typescript
const component = await loader.import();
console.log('Default export:', component.default);
console.log('Head component:', component.Head);
```

**Returns**

A promise that resolves to the imported module with all exports.

### 2.3. Getting Relative Path

Calculates a relative path from another file to this document. This method is useful for generating import statements and cross-references between files in the project.

```typescript
const relativePath = loader.relative('/src/components/Header.tsx');
console.log('Relative path:', relativePath);
// Output: ../pages/home
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `fromFile` | `string` | The source file path to calculate relative path from |

**Returns**

A relative path string from the source file to the document.

## 3. File System Integration

The DocumentLoader integrates seamlessly with the server's file system configuration to provide consistent behavior across different environments and deployment scenarios. Understanding this integration helps you work effectively with different file system setups.

### 3.1. Path Resolution

The loader uses the server's configuration for path resolution, including working directory settings and path mapping. It supports alias resolution and handles different file extensions automatically.

Path resolution includes support for the server's `cwd` configuration, path mapping for aliases like `@/`, and automatic file extension resolution for `.tsx`, `.jsx`, `.ts`, and `.js` files.

### 3.2. Module Loading Support

The loader provides comprehensive module loading capabilities with support for modern JavaScript features and development tools.

Module loading features include support for both CommonJS and ES modules, automatic file extension resolution, alias support for project-relative paths, and integration with development tools like hot module replacement.

## 4. Usage Examples

These examples demonstrate common patterns and use cases for working with DocumentLoader instances. Each example shows different aspects of file system operations and module loading.

### 4.1. Basic File Operations

This example shows how to perform basic file operations with a DocumentLoader instance, including path resolution and component importing.

```typescript
const document = await server.manifest.get('@/pages/home');
const loader = document.loader;

// Get absolute path
const absolutePath = await loader.absolute();
console.log('Document located at:', absolutePath);

// Import the component
const module = await loader.import();
const HomePage = module.default;
const Head = module.Head;

console.log('Component loaded:', typeof HomePage === 'function');
console.log('Head component available:', typeof Head === 'function');
```

### 4.2. Dynamic Component Loading

This example demonstrates how to load components dynamically based on routes or other runtime conditions.

```typescript
// Load components dynamically based on route
async function loadPageComponent(entry: string) {
  try {
    const document = await server.manifest.get(entry);
    const component = await document.loader.import();
    
    return {
      entry,
      path: await document.loader.absolute(),
      Component: component.default,
      Head: component.Head,
      hasHead: typeof component.Head === 'function'
    };
  } catch (error) {
    console.error(`Failed to load component for ${entry}:`, error);
    return null;
  }
}

// Load multiple pages
const pages = await Promise.all([
  loadPageComponent('@/pages/home'),
  loadPageComponent('@/pages/about'),
  loadPageComponent('@/pages/contact')
]);

console.log('Loaded pages:', pages.filter(Boolean));
```

### 4.3. Path Resolution

This example shows how to use the relative path functionality for generating import statements and cross-references.

```typescript
const document = await server.manifest.get('@/pages/blog/post');
const loader = document.loader;

// Get paths relative to different files
const relativeToRoot = loader.relative('/src/index.tsx');
const relativeToComponent = loader.relative('/src/components/Layout.tsx');
const relativeToPage = loader.relative('/pages/home.tsx');

console.log('Relative to root:', relativeToRoot);
console.log('Relative to component:', relativeToComponent);
console.log('Relative to page:', relativeToPage);
```

### 4.4. Component Validation

This example demonstrates how to validate that components have the required exports and are properly structured.

```typescript
// Validate that a component has required exports
async function validateComponent(entry: string) {
  const document = await server.manifest.get(entry);
  const module = await document.loader.import();
  
  const validation = {
    entry,
    hasDefault: typeof module.default === 'function',
    hasHead: typeof module.Head === 'function',
    exports: Object.keys(module),
    isValid: false
  };
  
  // Check if it's a valid React component
  if (validation.hasDefault) {
    try {
      const Component = module.default;
      // Basic React component validation
      validation.isValid = typeof Component === 'function';
    } catch (error) {
      console.error('Component validation failed:', error);
    }
  }
  
  return validation;
}

// Validate multiple components
const entries = ['@/pages/home', '@/pages/about', '@/pages/contact'];
const validations = await Promise.all(
  entries.map(entry => validateComponent(entry))
);

validations.forEach(validation => {
  if (validation.isValid) {
    console.log(`✓ ${validation.entry} is valid`);
  } else {
    console.log(`✗ ${validation.entry} is invalid`);
  }
});
```

### 4.5. Development vs Production Loading

This example shows how to handle component loading differently in development and production environments.

```typescript
async function loadComponentForEnvironment(entry: string) {
  const document = await server.manifest.get(entry);
  const loader = document.loader;
  
  if (server.production) {
    // In production, components should be pre-built
    try {
      const component = await loader.import();
      return {
        success: true,
        component: component.default,
        head: component.Head,
        mode: 'production'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Production component not found',
        mode: 'production'
      };
    }
  } else {
    // In development, load with error recovery
    try {
      const component = await loader.import();
      return {
        success: true,
        component: component.default,
        head: component.Head,
        mode: 'development',
        path: await loader.absolute()
      };
    } catch (error) {
      console.warn(`Development component load failed for ${entry}:`, error);
      return {
        success: false,
        error: error.message,
        mode: 'development'
      };
    }
  }
}

const result = await loadComponentForEnvironment('@/pages/home');
if (result.success) {
  console.log(`Component loaded in ${result.mode} mode`);
} else {
  console.error(`Failed to load component: ${result.error}`);
}
```

### 4.6. Batch Component Loading

This example demonstrates how to load multiple components efficiently with proper error handling and reporting.

```typescript
// Load multiple components efficiently
async function loadComponents(entries: string[]) {
  const results = await Promise.allSettled(
    entries.map(async (entry) => {
      const document = await server.manifest.get(entry);
      const component = await document.loader.import();
      const absolutePath = await document.loader.absolute();
      
      return {
        entry,
        path: absolutePath,
        component: component.default,
        head: component.Head,
        exports: Object.keys(component)
      };
    })
  );
  
  const successful = results
    .filter((result): result is PromiseFulfilledResult<any> => 
      result.status === 'fulfilled'
    )
    .map(result => result.value);
  
  const failed = results
    .filter((result): result is PromiseRejectedResult => 
      result.status === 'rejected'
    )
    .map((result, index) => ({
      entry: entries[index],
      error: result.reason.message
    }));
  
  return { successful, failed };
}

// Load all page components
const pageEntries = [
  '@/pages/home',
  '@/pages/about',
  '@/pages/contact',
  '@/pages/blog',
  '@/pages/404'
];

const { successful, failed } = await loadComponents(pageEntries);

console.log(`Successfully loaded ${successful.length} components`);
if (failed.length > 0) {
  console.error(`Failed to load ${failed.length} components:`, failed);
}
```

## 5. Error Handling

The DocumentLoader provides comprehensive error handling for various failure scenarios. Understanding common error patterns helps with debugging and maintaining reliable applications.

### 5.1. Common Error Patterns

File system operations and module loading can fail for various reasons including missing files, syntax errors, and permission issues. Proper error handling ensures graceful degradation and helpful debugging information.

```typescript
const document = await server.manifest.get('@/pages/home');

try {
  const absolutePath = await document.loader.absolute();
  console.log('File exists at:', absolutePath);
} catch (error) {
  if (error.message.includes('File not found')) {
    console.error('Document file does not exist');
  } else {
    console.error('Path resolution failed:', error);
  }
}

try {
  const component = await document.loader.import();
  console.log('Component imported successfully');
} catch (error) {
  if (error.message.includes('Module not found')) {
    console.error('Component file missing or has syntax errors');
  } else if (error.message.includes('SyntaxError')) {
    console.error('Component has syntax errors:', error);
  } else {
    console.error('Import failed:', error);
  }
}
```

### 5.2. Error Recovery Strategies

Implement robust error recovery strategies to handle component loading failures gracefully and provide fallback mechanisms.

Error recovery strategies include fallback component loading, graceful degradation for missing components, retry mechanisms for transient failures, and comprehensive logging for debugging purposes.

## 6. Advanced Features

The DocumentLoader provides advanced features for performance optimization, development tools integration, and complex loading scenarios. These features help you build robust, high-performance applications.

### 6.1. Component Caching

Implement caching strategies to improve performance and reduce redundant file system operations during development and production.

```typescript
// Simple component caching system
class ComponentCache {
  private cache = new Map<string, any>();
  
  async loadWithCache(document: Document) {
    const cacheKey = document.entry;
    
    if (this.cache.has(cacheKey)) {
      console.log(`Using cached component for ${cacheKey}`);
      return this.cache.get(cacheKey);
    }
    
    try {
      const component = await document.loader.import();
      this.cache.set(cacheKey, component);
      console.log(`Cached component for ${cacheKey}`);
      return component;
    } catch (error) {
      console.error(`Failed to load component ${cacheKey}:`, error);
      throw error;
    }
  }
  
  invalidate(entry?: string) {
    if (entry) {
      this.cache.delete(entry);
      console.log(`Invalidated cache for ${entry}`);
    } else {
      this.cache.clear();
      console.log('Cleared all component cache');
    }
  }
  
  get size() {
    return this.cache.size;
  }
}

// Usage
const cache = new ComponentCache();

const document = await server.manifest.get('@/pages/home');
const component1 = await cache.loadWithCache(document); // Loads from file
const component2 = await cache.loadWithCache(document); // Loads from cache

console.log('Cache size:', cache.size);
```

### 6.2. Hot Module Replacement Support

Integrate with development tools like hot module replacement for improved development experience and faster iteration cycles.

```typescript
// Development-only: Handle HMR for components
if (!server.production && typeof module !== 'undefined' && module.hot) {
  const document = await server.manifest.get('@/pages/home');
  
  // Watch for changes to the component file
  const absolutePath = await document.loader.absolute();
  
  module.hot.accept(absolutePath, async () => {
    console.log('Component updated, reloading...');
    
    try {
      // Clear any caches
      delete require.cache[absolutePath];
      
      // Reload component
      const updatedComponent = await document.loader.import();
      console.log('Component reloaded successfully');
      
      // Trigger re-render if needed
      // This would integrate with your rendering system
      
    } catch (error) {
      console.error('Failed to reload component:', error);
    }
  });
}
