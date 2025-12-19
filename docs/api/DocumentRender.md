# DocumentRender

The DocumentRender class handles the rendering of React components to HTML markup. It manages server-side rendering, client-side hydration setup, and Hot Module Replacement (HMR) integration for development.

This class is responsible for converting React components into HTML strings that can be sent to browsers, while also preparing the necessary client-side scripts for hydration. It integrates with React's server-side rendering capabilities and provides development features like hot module replacement for an optimal development experience.

```typescript
import { DocumentRender } from 'reactus';

// DocumentRender is typically accessed through a Document instance
const document = await server.manifest.get('@/pages/home');
const renderer = document.render;
```

 1. [Properties](#1-properties)
 2. [Methods](#2-methods)
 3. [HTML Structure](#3-html-structure)
 4. [Usage Examples](#4-usage-examples)
 5. [Performance Optimization](#5-performance-optimization)
 6. [React Integration](#6-react-integration)

## 1. Properties

The following properties are available when instantiating a DocumentRender. These properties provide access to the parent document and its associated configuration and context.

| Property | Type | Description |
|----------|------|-------------|
| `document` | `Document` | Reference to the parent document instance |

## 2. Methods

The following methods are available when instantiating a DocumentRender. These methods provide comprehensive rendering functionality for converting React components to HTML and managing development features.

### 2.1. Rendering HTML Markup

Renders complete HTML markup for a document including the React component, head section, and client-side hydration scripts. This method performs server-side rendering and prepares the page for client-side hydration.

```typescript
const html = await renderer.renderMarkup({
  title: 'Home Page',
  user: { name: 'John', email: 'john@example.com' }
});
console.log('Generated HTML:', html);
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `props` | `UnknownNest` | Props to pass to the React component (default: {}) |

**Returns**

A promise that resolves to the complete HTML markup string.

### 2.2. Rendering HMR Client

Renders the Hot Module Replacement client script for development environments. This method generates the JavaScript code needed for hot reloading during development.

```typescript
const hmrScript = await renderer.renderHMRClient();
console.log('HMR script:', hmrScript);
```

**Returns**

A promise that resolves to the HMR client JavaScript code string.

## 3. HTML Structure

The rendered HTML follows a specific structure that ensures compatibility with client-side hydration and provides optimal performance. Understanding this structure helps with debugging and customization.

### 3.1. Document Structure

The rendered HTML includes a complete HTML5 document with proper DOCTYPE declaration, meta tags, and structured content areas for different types of content.

The HTML structure includes:

 - **Document Structure**: Complete HTML5 document with DOCTYPE
 - **Head Section**: Meta tags, title, stylesheets from Head component
 - **Body Content**: Rendered React component markup
 - **Client Scripts**: Hydration scripts and HMR (development only)
 - **CSS Integration**: Inline styles and external stylesheets

### 3.2. Hydration Compatibility

The rendered markup is designed to be compatible with client-side hydration, ensuring that the server-rendered content matches exactly what React would render on the client side.

This compatibility prevents hydration mismatches and ensures smooth transitions from server-rendered content to interactive client-side applications.

## 4. Usage Examples

These examples demonstrate common rendering patterns and use cases for the DocumentRender class. Each example shows different aspects of the rendering process and how to handle various scenarios.

### 4.1. Basic Rendering

This example shows how to perform basic rendering with props and handle the generated HTML output.

```typescript
const document = await server.manifest.get('@/pages/home');
const renderer = document.render;

// Render with props
const html = await renderer.renderMarkup({
  title: 'Welcome Home',
  user: {
    name: 'John Doe',
    email: 'john@example.com'
  },
  timestamp: Date.now()
});

console.log('Rendered HTML length:', html.length);
```

### 4.2. Development vs Production Rendering

This example demonstrates how rendering behavior differs between development and production environments, particularly regarding HMR integration.

```typescript
const document = await server.manifest.get('@/pages/home');

if (server.production) {
  // Production rendering - optimized HTML only
  const html = await document.render.renderMarkup({
    title: 'Production Page'
  });
  
  // No HMR in production
  console.log('Production HTML generated');
  
} else {
  // Development rendering - includes HMR
  const html = await document.render.renderMarkup({
    title: 'Development Page'
  });
  
  // Get HMR client script
  const hmrScript = await document.render.renderHMRClient();
  
  console.log('Development HTML with HMR generated');
  console.log('HMR script length:', hmrScript.length);
}
```

### 4.3. Error Handling

This example shows how to handle common rendering errors and implement proper error recovery strategies.

```typescript
const document = await server.manifest.get('@/pages/home');

try {
  const html = await document.render.renderMarkup({
    title: 'Test Page'
  });
  console.log('Rendering successful');
} catch (error) {
  if (error.message.includes('Component not found')) {
    console.error('Component file missing');
  } else if (error.message.includes('React rendering failed')) {
    console.error('Component has runtime errors:', error);
  } else if (error.message.includes('Props validation failed')) {
    console.error('Invalid props passed to component:', error);
  } else {
    console.error('Unknown rendering error:', error);
  }
}
```

### 4.4. Custom Rendering Pipeline

This example demonstrates how to create a custom rendering pipeline that extends the basic rendering functionality with layouts and metadata.

```typescript
// Create a custom rendering pipeline
class CustomRenderer {
  constructor(private document: Document) {}
  
  async renderWithLayout(props: any = {}, layoutProps: any = {}) {
    try {
      // Render the page component
      const pageHtml = await this.document.render.renderMarkup(props);
      
      // Load layout component
      const layoutDocument = await this.document.server.manifest.get('@/layouts/main');
      const layoutHtml = await layoutDocument.render.renderMarkup({
        ...layoutProps,
        children: pageHtml
      });
      
      return layoutHtml;
    } catch (error) {
      console.error('Custom rendering failed:', error);
      throw error;
    }
  }
  
  async renderWithMetadata(props: any = {}) {
    // Add metadata to props
    const enhancedProps = {
      ...props,
      meta: {
        timestamp: Date.now(),
        version: process.env.npm_package_version,
        environment: this.document.server.production ? 'production' : 'development'
      }
    };
    
    return await this.document.render.renderMarkup(enhancedProps);
  }
}

// Usage
const document = await server.manifest.get('@/pages/home');
const customRenderer = new CustomRenderer(document);

const htmlWithLayout = await customRenderer.renderWithLayout(
  { title: 'Home' },
  { siteName: 'My Website' }
);

const htmlWithMeta = await customRenderer.renderWithMetadata({
  title: 'Home',
  user: { name: 'John' }
});
```

### 4.5. Batch Rendering

This example shows how to render multiple pages efficiently with proper error handling and performance monitoring.

```typescript
// Render multiple pages efficiently
async function renderPages(entries: string[], commonProps: any = {}) {
  const results = await Promise.allSettled(
    entries.map(async (entry) => {
      const document = await server.manifest.get(entry);
      const html = await document.render.renderMarkup({
        ...commonProps,
        entry // Pass entry as prop
      });
      
      return {
        entry,
        html,
        size: html.length
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

// Render all pages with common props
const pageEntries = ['@/pages/home', '@/pages/about', '@/pages/contact'];
const commonProps = {
  siteName: 'My Website',
  year: new Date().getFullYear()
};

const { successful, failed } = await renderPages(pageEntries, commonProps);

console.log(`Successfully rendered ${successful.length} pages`);
successful.forEach(page => {
  console.log(`${page.entry}: ${page.size} bytes`);
});

if (failed.length > 0) {
  console.error(`Failed to render ${failed.length} pages:`, failed);
}
```

### 4.6. Static Site Generation

This example demonstrates how to use the renderer for static site generation, creating HTML files for deployment.

```typescript
// Generate static HTML files for all pages
async function generateStaticSite(outputDir: string) {
  const fs = require('fs').promises;
  const path = require('path');
  
  // Ensure output directory exists
  await fs.mkdir(outputDir, { recursive: true });
  
  // Get all page entries
  const entries = server.manifest.entries().map(([entry]) => entry);
  
  for (const entry of entries) {
    try {
      const document = await server.manifest.get(entry);
      
      // Render the page
      const html = await document.render.renderMarkup({
        static: true,
        generatedAt: new Date().toISOString()
      });
      
      // Determine output file path
      const fileName = entry.replace('@/pages/', '').replace(/\.(tsx|jsx)$/, '.html');
      const filePath = path.join(outputDir, fileName);
      
      // Ensure directory exists
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      
      // Write HTML file
      await fs.writeFile(filePath, html, 'utf8');
      
      console.log(`Generated: ${filePath}`);
      
    } catch (error) {
      console.error(`Failed to generate ${entry}:`, error.message);
    }
  }
  
  console.log(`Static site generated in ${outputDir}`);
}

// Generate static site
await generateStaticSite('./dist/static');
```

## 5. Performance Optimization

Performance optimization techniques help improve rendering speed, reduce memory usage, and enhance the overall user experience. Understanding these techniques is essential for production deployments.

### 5.1. Render Caching

Implement caching strategies to avoid redundant rendering operations and improve response times for frequently accessed pages.

```typescript
// Simple render caching system
class RenderCache {
  private cache = new Map<string, { html: string; timestamp: number }>();
  private ttl = 5 * 60 * 1000; // 5 minutes
  
  async renderWithCache(document: Document, props: any = {}) {
    const cacheKey = this.getCacheKey(document.entry, props);
    const cached = this.cache.get(cacheKey);
    
    // Check if cached version is still valid
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      console.log(`Using cached render for ${document.entry}`);
      return cached.html;
    }
    
    // Render fresh
    const html = await document.render.renderMarkup(props);
    
    // Cache the result
    this.cache.set(cacheKey, {
      html,
      timestamp: Date.now()
    });
    
    console.log(`Cached fresh render for ${document.entry}`);
    return html;
  }
  
  private getCacheKey(entry: string, props: any): string {
    // Create a simple cache key from entry and props
    const propsHash = JSON.stringify(props);
    return `${entry}:${Buffer.from(propsHash).toString('base64')}`;
  }
  
  invalidate(entry?: string) {
    if (entry) {
      // Remove all cache entries for this document
      for (const key of this.cache.keys()) {
        if (key.startsWith(entry + ':')) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }
  
  get size() {
    return this.cache.size;
  }
}

// Usage
const cache = new RenderCache();

const document = await server.manifest.get('@/pages/home');
const html1 = await cache.renderWithCache(document, { title: 'Home' }); // Fresh render
const html2 = await cache.renderWithCache(document, { title: 'Home' }); // From cache

console.log('Cache size:', cache.size);
```

### 5.2. Performance Monitoring

Monitor rendering performance to identify bottlenecks and optimize slow-rendering components.

```typescript
// Monitor rendering performance
class RenderMonitor {
  private metrics = new Map<string, number[]>();
  
  async measureRender(document: Document, props: any = {}) {
    const startTime = Date.now();
    
    try {
      const html = await document.render.renderMarkup(props);
      const renderTime = Date.now() - startTime;
      
      // Store metric
      if (!this.metrics.has(document.entry)) {
        this.metrics.set(document.entry, []);
      }
      this.metrics.get(document.entry)!.push(renderTime);
      
      console.log(`Rendered ${document.entry} in ${renderTime}ms`);
      
      return {
        html,
        renderTime,
        size: html.length
      };
      
    } catch (error) {
      const errorTime = Date.now() - startTime;
      console.error(`Render failed for ${document.entry} after ${errorTime}ms:`, error);
      throw error;
    }
  }
  
  getStats(entry?: string) {
    if (entry) {
      const times = this.metrics.get(entry) || [];
      return this.calculateStats(times);
    }
    
    // Get stats for all entries
    const allStats: Record<string, any> = {};
    for (const [entryKey, times] of this.metrics.entries()) {
      allStats[entryKey] = this.calculateStats(times);
    }
    return allStats;
  }
  
  private calculateStats(times: number[]) {
    if (times.length === 0) return null;
    
    const sorted = [...times].sort((a, b) => a - b);
    return {
      count: times.length,
      min: Math.min(...times),
      max: Math.max(...times),
      avg: times.reduce((a, b) => a + b, 0) / times.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)]
    };
  }
}

// Usage
const monitor = new RenderMonitor();

const document = await server.manifest.get('@/pages/home');
const result = await monitor.measureRender(document, { title: 'Home' });

console.log('Render result:', result);
console.log('Performance stats:', monitor.getStats('@/pages/home'));
```

## 6. React Integration

DocumentRender integrates seamlessly with React's server-side rendering capabilities to provide optimal performance and compatibility. Understanding this integration helps you leverage React's full feature set.

### 6.1. Server-Side Rendering

The renderer uses React's server-side rendering APIs to convert components into HTML strings while maintaining compatibility with client-side hydration.

DocumentRender integrates seamlessly with React through:

 - **Server-Side Rendering**: Uses ReactDOMServer.renderToString()
 - **Component Props**: Type-safe prop passing to components
 - **Head Management**: Extracts and renders Head component separately
 - **Hydration Setup**: Prepares client-side hydration scripts
 - **Error Boundaries**: Handles component rendering errors gracefully

### 6.2. Hydration Compatibility

The renderer ensures that server-rendered markup is compatible with client-side hydration for seamless user experiences. This includes proper prop serialization, consistent rendering output, and appropriate script injection.

The hydration process is automatic and requires no additional configuration, providing a smooth transition from server-rendered content to interactive client-side applications.
