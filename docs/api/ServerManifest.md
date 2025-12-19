# ServerManifest

The ServerManifest class manages the collection of documents in a Reactus application. It provides methods to add, retrieve, and manage document entries, as well as persist and load manifest data. This class serves as the central registry for all documents in your application, handling both development and production workflows with efficient caching and persistence mechanisms.

```typescript
import { ServerManifest } from 'reactus';

// ServerManifest is typically accessed through a Server instance
const manifest = server.manifest;
```

 1. [Properties](#1-properties)
 2. [Methods](#2-methods)
 3. [Static Methods](#3-static-methods)
 4. [Integration Examples](#4-integration-examples)

## 1. Properties

The following properties are available when instantiating a ServerManifest. These properties provide access to the underlying server instance and information about the current state of the manifest.

| Property | Type | Description |
|----------|------|-------------|
| `server` | `Server` | Reference to the parent server instance |
| `size` | `number` | Number of documents in the manifest |

## 2. Methods

The following methods are available when instantiating a ServerManifest. These methods provide comprehensive document management capabilities including adding, retrieving, checking existence, and iterating over documents.

### 2.1. Adding Document Entries

Adds a document entry to the manifest and returns the corresponding Document instance. This method creates a new document if it doesn't exist or returns the existing one if already present.

```typescript
const document = await manifest.set('@/pages/home');
console.log('Document added:', document.entry);
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `entry` | `string` | The entry path for the document (e.g., '@/pages/home') |

**Returns**

A promise that resolves to the Document instance.

### 2.2. Getting Document Entries

Retrieves a document from the manifest by its entry path. This method returns the existing Document instance or throws an error if the document is not found.

```typescript
const document = await manifest.get('@/pages/home');
console.log('Document ID:', document.id);
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `entry` | `string` | The entry path for the document |

**Returns**

A promise that resolves to the Document instance.

### 2.3. Checking Document Existence

Checks if a document exists in the manifest by its entry path. This method provides a safe way to verify document existence before attempting to retrieve it.

```typescript
const exists = await manifest.has('@/pages/home');
console.log('Document exists:', exists);
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `entry` | `string` | The entry path to check |

**Returns**

A promise that resolves to a boolean indicating existence.

### 2.4. Finding Documents by ID

Finds a document in the manifest by its unique ID. This method performs a search across all documents and returns the first match or undefined if not found.

```typescript
const document = manifest.find('abc123');
console.log('Found document:', document?.entry);
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `id` | `string` | The document ID to search for |

**Returns**

The Document instance if found, or undefined.

### 2.5. Getting All Entries

Returns all document entries as an array of tuples containing the entry path and corresponding Document instance. This method provides access to the complete manifest contents.

```typescript
const entries = manifest.entries();
console.log('All entries:', entries);
```

**Returns**

An array of [entry, document] tuples.

### 2.6. Getting All Documents

Returns all Document instances in the manifest as an array. This method provides direct access to all document objects without their entry paths.

```typescript
const documents = manifest.values();
console.log('All documents:', documents.length);
```

**Returns**

An array of Document instances.

### 2.7. Iterating Over Documents

Iterates over all documents in the manifest, calling the provided callback function for each document. This method supports asynchronous operations and can be used for batch processing.

```typescript
await manifest.forEach(async (document, entry) => {
  console.log(`Processing ${entry}...`);
  const html = await document.render.renderMarkup();
  return true; // Continue iteration
});
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `callback` | `DocumentIterator<unknown>` | Function to call for each document |

**Returns**

A promise that resolves when iteration is complete.

### 2.8. Mapping Over Documents

Maps over all documents in the manifest, transforming each document using the provided callback function. This method returns a new array with the transformed results.

```typescript
const results = manifest.map((document, entry) => ({
  entry,
  id: document.id,
  path: document.loader.absolute()
}));
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `callback` | `DocumentIterator<T>` | Function to call for each document |

**Returns**

An array of mapped results.

### 2.9. Loading Manifest from Hash

Loads manifest data from a hash object mapping entry paths to document IDs. This method is typically used to restore a previously saved manifest state.

```typescript
const manifestData = {
  '@/pages/home': 'abc123',
  '@/pages/about': 'def456'
};
manifest.load(manifestData);
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `hash` | `Record<string, string>` | Object mapping entries to document IDs |

**Returns**

The ServerManifest instance for chaining.

### 2.10. Saving Manifest to File

Saves the current manifest state to a JSON file. This method is essential for production builds where the manifest needs to be persisted for server startup.

```typescript
await manifest.save('./dist/manifest.json');
console.log('Manifest saved');
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `file` | `string` | File path to save the manifest |

**Returns**

A promise that resolves when the file is saved.

### 2.11. Loading Manifest from File

Loads manifest data from a JSON file. This method is typically used in production environments to restore a pre-built manifest state.

```typescript
await manifest.open('./dist/manifest.json');
console.log('Manifest loaded');
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `file` | `string` | File path to load the manifest from |

**Returns**

A promise that resolves when the file is loaded.

### 2.12. Converting to JSON

Converts the manifest to a JSON-serializable object. This method returns a plain object mapping entry paths to document IDs, suitable for serialization and storage.

```typescript
const json = manifest.toJSON();
console.log('Manifest JSON:', json);
```

**Returns**

An object mapping entry paths to document IDs.

## 3. Static Methods

The ServerManifest class does not expose any static methods. All functionality is provided through instance methods that operate on the manifest's internal document collection.

## 4. Integration Examples

The following examples demonstrate how to integrate ServerManifest into various application workflows, from basic operations to advanced production scenarios.

### 4.1. Basic Manifest Operations

```typescript
const server = new Server({ /* config */ });
const manifest = server.manifest;

// Add documents to manifest
await manifest.set('@/pages/home');
await manifest.set('@/pages/about');
await manifest.set('@/pages/contact');

console.log('Manifest size:', manifest.size);

// Check if document exists
const hasHome = await manifest.has('@/pages/home');
console.log('Has home page:', hasHome);

// Get document
const homeDoc = await manifest.get('@/pages/home');
console.log('Home document ID:', homeDoc.id);
```

### 4.2. Batch Document Management

```typescript
// Add multiple documents
const entries = [
  '@/pages/home',
  '@/pages/about',
  '@/pages/contact',
  '@/pages/blog',
  '@/pages/404'
];

const documents = await Promise.all(
  entries.map(entry => manifest.set(entry))
);

console.log(`Added ${documents.length} documents to manifest`);

// Process all documents
const results = manifest.map((document, entry) => ({
  entry,
  id: document.id,
  hasBuilder: !!document.builder,
  hasLoader: !!document.loader,
  hasRender: !!document.render
}));

console.log('Document analysis:', results);
```

### 4.3. Manifest Persistence

```typescript
// Save manifest after building
const builder = new Builder({ /* config */ });

// Add pages to manifest
await builder.manifest.set('@/pages/home');
await builder.manifest.set('@/pages/about');

// Build all pages
await builder.buildAllAssets();
await builder.buildAllClients();
await builder.buildAllPages();

// Save manifest for production use
await builder.manifest.save('./dist/manifest.json');
console.log('Build manifest saved');

// Later, in production server
const server = new Server({ production: true });
await server.manifest.open('./dist/manifest.json');
console.log('Production manifest loaded');
```

### 4.4. Error Handling

```typescript
try {
  const document = await manifest.get('@/pages/nonexistent');
} catch (error) {
  if (error.message.includes('Document not found')) {
    console.error('Page does not exist');
  } else {
    console.error('Manifest error:', error);
  }
}

try {
  await manifest.save('/invalid/path/manifest.json');
} catch (error) {
  console.error('Failed to save manifest:', error);
}

try {
  await manifest.open('./missing-manifest.json');
} catch (error) {
  console.error('Failed to load manifest:', error);
}
```

### 4.5. Custom Manifest Operations

```typescript
// Create a custom manifest manager
class ManifestManager {
  constructor(private manifest: ServerManifest) {}
  
  async addPagesFromDirectory(directory: string) {
    const glob = require('glob');
    const path = require('path');
    
    const pageFiles = await glob(`${directory}/**/*.{tsx,jsx}`);
    const entries = pageFiles.map(file => 
      '@/' + path.relative(process.cwd(), file)
    );
    
    const documents = await Promise.all(
      entries.map(entry => this.manifest.set(entry))
    );
    
    console.log(`Added ${documents.length} pages from ${directory}`);
    return documents;
  }
  
  async validateAllDocuments() {
    const results = await Promise.allSettled(
      this.manifest.values().map(async (document) => {
        try {
          // Try to load the component
          await document.loader.import();
          return { entry: document.entry, valid: true };
        } catch (error) {
          return { 
            entry: document.entry, 
            valid: false, 
            error: error.message 
          };
        }
      })
    );
    
    const validations = results.map(result => 
      result.status === 'fulfilled' ? result.value : null
    ).filter(Boolean);
    
    const valid = validations.filter(v => v.valid);
    const invalid = validations.filter(v => !v.valid);
    
    console.log(`Validation: ${valid.length} valid, ${invalid.length} invalid`);
    return { valid, invalid };
  }
  
  async getManifestStats() {
    const entries = this.manifest.entries();
    const stats = {
      totalDocuments: entries.length,
      entriesByType: {} as Record<string, number>,
      averageIdLength: 0,
      duplicateIds: [] as string[]
    };
    
    // Analyze entries
    const ids = new Set<string>();
    const duplicates = new Set<string>();
    let totalIdLength = 0;
    
    for (const [entry, document] of entries) {
      // Count by type (based on path)
      const type = entry.split('/')[1] || 'unknown';
      stats.entriesByType[type] = (stats.entriesByType[type] || 0) + 1;
      
      // Check for duplicate IDs
      if (ids.has(document.id)) {
        duplicates.add(document.id);
      } else {
        ids.add(document.id);
      }
      
      totalIdLength += document.id.length;
    }
    
    stats.averageIdLength = totalIdLength / entries.length;
    stats.duplicateIds = Array.from(duplicates);
    
    return stats;
  }
}

// Usage
const manager = new ManifestManager(server.manifest);

// Add all pages from directory
await manager.addPagesFromDirectory('./pages');

// Validate all documents
const validation = await manager.validateAllDocuments();

// Get statistics
const stats = await manager.getManifestStats();
console.log('Manifest stats:', stats);
```

### 4.6. Development vs Production

```typescript
// Development: Dynamic manifest
if (!server.production) {
  // Add documents as needed
  const document = await manifest.set('@/pages/home');
  
  // Build on demand
  await document.builder.buildAssets();
  
  // Render with HMR
  const html = await document.render.renderMarkup();
  
} else {
  // Production: Load pre-built manifest
  await manifest.open('./dist/manifest.json');
  
  // All documents should be pre-built
  const document = await manifest.get('@/pages/home');
  
  // Render without building
  const html = await document.render.renderMarkup();
}
```

### 4.7. Manifest Caching

```typescript
// Cache manifest operations for performance
class CachedManifest {
  private documentCache = new Map<string, Document>();
  private existsCache = new Map<string, boolean>();
  
  constructor(private manifest: ServerManifest) {}
  
  async get(entry: string): Promise<Document> {
    if (this.documentCache.has(entry)) {
      return this.documentCache.get(entry)!;
    }
    
    const document = await this.manifest.get(entry);
    this.documentCache.set(entry, document);
    return document;
  }
  
  async has(entry: string): Promise<boolean> {
    if (this.existsCache.has(entry)) {
      return this.existsCache.get(entry)!;
    }
    
    const exists = await this.manifest.has(entry);
    this.existsCache.set(entry, exists);
    return exists;
  }
  
  async set(entry: string): Promise<Document> {
    const document = await this.manifest.set(entry);
    this.documentCache.set(entry, document);
    this.existsCache.set(entry, true);
    return document;
  }
  
  invalidate(entry?: string) {
    if (entry) {
      this.documentCache.delete(entry);
      this.existsCache.delete(entry);
    } else {
      this.documentCache.clear();
      this.existsCache.clear();
    }
  }
}

// Usage
const cachedManifest = new CachedManifest(server.manifest);

const doc1 = await cachedManifest.get('@/pages/home'); // From manifest
const doc2 = await cachedManifest.get('@/pages/home'); // From cache
```

### 4.8. Manifest File Format

The manifest file is a JSON object mapping entry paths to document IDs. This standardized format enables efficient document management and supports various optimization strategies.

```json
{
  "@/pages/home": "a1b2c3d4",
  "@/pages/about": "e5f6g7h8",
  "@/pages/contact": "i9j0k1l2"
}
```

**Format Benefits**

 - **Fast lookups**: Direct mapping from entry to document
 - **Version tracking**: Document IDs change when content changes
 - **Cache invalidation**: Different IDs indicate updated content
 - **Build optimization**: Only rebuild changed documents

The ServerManifest class provides a centralized way to manage all documents in a Reactus application, supporting both development and production workflows with efficient caching and persistence mechanisms.
