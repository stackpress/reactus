# VirtualServer

The VirtualServer class provides an in-memory virtual file system for Reactus applications. It allows storing and retrieving file contents in memory, which is useful for development, testing, and dynamic content generation. This class enables efficient file operations without disk I/O, making it ideal for temporary storage, mock data, and build-time code generation.

```typescript
import { VirtualServer } from 'reactus';

// VirtualServer is typically accessed through a Server instance
const vfs = server.vfs;
```

 1. [Properties](#1-properties)
 2. [Methods](#2-methods)
 3. [Static Methods](#3-static-methods)
 4. [Integration Examples](#4-integration-examples)

## 1. Properties

The following properties are available when instantiating a VirtualServer. These properties provide access to the internal file storage system for virtual file management.

| Property | Type | Description |
|----------|------|-------------|
| `files` | `Map<string, string>` | Internal storage for virtual files (private) |

## 2. Methods

The following methods are available when instantiating a VirtualServer. These methods provide comprehensive virtual file system operations including storing, retrieving, and checking file existence.

### 2.1. Setting File Content

Stores content in the virtual file system at the specified path. This method creates or overwrites a virtual file with the provided content, enabling in-memory file operations.

```typescript
vfs.set('/virtual/component.tsx', `
export default function VirtualComponent() {
  return <div>Virtual Content</div>;
}
`);
console.log('Virtual file created');
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `filepath` | `string` | The virtual file path |
| `contents` | `string` | The file contents to store |

**Returns**

The VirtualServer instance for method chaining.

### 2.2. Getting File Content

Retrieves content from the virtual file system by file path. This method returns the stored content or undefined if the file doesn't exist in the virtual file system.

```typescript
const content = vfs.get('/virtual/component.tsx');
console.log('File content:', content);
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `filepath` | `string` | The virtual file path to retrieve |

**Returns**

The file contents as a string, or undefined if the file doesn't exist.

### 2.3. Checking File Existence

Checks if a file exists in the virtual file system. This method provides a safe way to verify file existence before attempting to retrieve content.

```typescript
const exists = vfs.has('/virtual/component.tsx');
console.log('File exists:', exists);
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `filepath` | `string` | The virtual file path to check |

**Returns**

A boolean indicating whether the file exists in the virtual file system.

## 3. Static Methods

The VirtualServer class does not expose any static methods. All functionality is provided through instance methods that operate on the internal file storage system.

## 4. Integration Examples

The following examples demonstrate how to integrate VirtualServer into various development workflows, from basic file operations to advanced code generation and template systems.

### 4.1. Basic Virtual File Operations

This example demonstrates the fundamental operations of the VirtualServer including creating, checking, and retrieving virtual files. These operations form the foundation for more advanced virtual file system usage.

```typescript
const server = new Server({ /* config */ });
const vfs = server.vfs;

// Create virtual files
vfs.set('/virtual/config.json', JSON.stringify({
  apiUrl: 'https://api.example.com',
  version: '1.0.0'
}));

vfs.set('/virtual/utils.ts', `
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
`);

// Check if files exist
console.log('Config exists:', vfs.has('/virtual/config.json'));
console.log('Utils exists:', vfs.has('/virtual/utils.ts'));

// Retrieve file contents
const config = JSON.parse(vfs.get('/virtual/config.json') || '{}');
const utilsCode = vfs.get('/virtual/utils.ts');

console.log('Config:', config);
console.log('Utils code length:', utilsCode?.length);
```

### 4.2. Dynamic Component Generation

This example shows how to use VirtualServer for generating React components dynamically at runtime. This approach is useful for creating components based on configuration or user input.

```typescript
// Generate components dynamically
function generateComponent(name: string, props: string[], content: string) {
  const propsInterface = props.length > 0 
    ? `interface ${name}Props {\n  ${props.join(';\n  ')};\n}`
    : '';
  
  const componentCode = `
${propsInterface}

export default function ${name}(${props.length > 0 ? `props: ${name}Props` : ''}) {
  ${props.length > 0 ? `const { ${props.map(p => p.split(':')[0]).join(', ')} } = props;` : ''}
  
  return (
    <div className="${name.toLowerCase()}">
      ${content}
    </div>
  );
}
`;

  return componentCode;
}

// Create virtual components
const vfs = server.vfs;

vfs.set('/virtual/UserCard.tsx', generateComponent(
  'UserCard',
  ['name: string', 'email: string', 'avatar?: string'],
  `
    <div className="user-info">
      {avatar && <img src={avatar} alt={name} />}
      <h3>{name}</h3>
      <p>{email}</p>
    </div>
  `
));

vfs.set('/virtual/ProductList.tsx', generateComponent(
  'ProductList',
  ['products: Product[]', 'onSelect: (product: Product) => void'],
  `
    <div className="product-grid">
      {products.map(product => (
        <div key={product.id} onClick={() => onSelect(product)}>
          <h4>{product.name}</h4>
          <p>{product.price}</p>
        </div>
      ))}
    </div>
  `
));

console.log('Generated components:', vfs.has('/virtual/UserCard.tsx'));
```

### 4.3. Template System

This example demonstrates how to build a simple template system using VirtualServer. The template system supports variable substitution and can be used for generating dynamic content.

```typescript
// Create a simple template system using VirtualServer
class TemplateSystem {
  constructor(private vfs: VirtualServer) {}
  
  createTemplate(name: string, template: string, data: Record<string, any> = {}) {
    // Simple template replacement
    let content = template;
    
    Object.entries(data).forEach(([key, value]) => {
      const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      content = content.replace(placeholder, String(value));
    });
    
    this.vfs.set(`/templates/${name}`, content);
    return content;
  }
  
  renderTemplate(name: string, data: Record<string, any> = {}): string | undefined {
    const template = this.vfs.get(`/templates/${name}`);
    if (!template) return undefined;
    
    let content = template;
    Object.entries(data).forEach(([key, value]) => {
      const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      content = content.replace(placeholder, String(value));
    });
    
    return content;
  }
  
  listTemplates(): string[] {
    const templates: string[] = [];
    // Note: VirtualServer doesn't expose iteration, so this is conceptual
    // In practice, you'd track template names separately
    return templates;
  }
}

// Usage
const templateSystem = new TemplateSystem(server.vfs);

// Create email template
templateSystem.createTemplate('welcome-email', `
<html>
  <body>
    <h1>Welcome, {{ name }}!</h1>
    <p>Thank you for joining {{ siteName }}.</p>
    <p>Your account email is: {{ email }}</p>
  </body>
</html>
`);

// Render template with data
const emailHtml = templateSystem.renderTemplate('welcome-email', {
  name: 'John Doe',
  siteName: 'My App',
  email: 'john@example.com'
});

console.log('Rendered email:', emailHtml);
```

### 4.4. Development Utilities

This example shows how to create development utilities that leverage VirtualServer for generating mock data, test files, and API mocks. These utilities enhance the development workflow.

```typescript
// Development utilities using VirtualServer
class DevUtils {
  constructor(private vfs: VirtualServer) {}
  
  createMockData(name: string, data: any) {
    const mockContent = `
// Auto-generated mock data
export const ${name} = ${JSON.stringify(data, null, 2)};

export default ${name};
`;
    
    this.vfs.set(`/mocks/${name}.ts`, mockContent);
    return mockContent;
  }
  
  createTestComponent(componentName: string, testCases: string[]) {
    const testContent = `
import { render, screen } from '@testing-library/react';
import ${componentName} from '../${componentName}';

describe('${componentName}', () => {
  ${testCases.map((testCase, index) => `
  it('${testCase}', () => {
    // Test implementation for: ${testCase}
    render(<${componentName} />);
    // Add assertions here
  });`).join('\n')}
});
`;
    
    this.vfs.set(`/tests/${componentName}.test.tsx`, testContent);
    return testContent;
  }
  
  createApiMock(endpoint: string, response: any) {
    const mockContent = `
// Mock for ${endpoint}
export const ${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}Mock = {
  endpoint: '${endpoint}',
  response: ${JSON.stringify(response, null, 2)},
  handler: (req: any, res: any) => {
    res.json(${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}Mock.response);
  }
};
`;
    
    this.vfs.set(`/mocks/api/${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}.ts`, mockContent);
    return mockContent;
  }
}

// Usage
const devUtils = new DevUtils(server.vfs);

// Create mock data
devUtils.createMockData('users', [
  { id: 1, name: 'John Doe', email: 'john@example.com' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
]);

// Create test template
devUtils.createTestComponent('UserCard', [
  'renders user name correctly',
  'displays email when provided',
  'handles missing avatar gracefully'
]);

// Create API mock
devUtils.createApiMock('/api/users', {
  users: [
    { id: 1, name: 'John Doe' },
    { id: 2, name: 'Jane Smith' }
  ],
  total: 2
});
```

### 4.5. Build-time Code Generation

This example demonstrates how to use VirtualServer for generating code at build time, including routes, types, and constants. This approach enables automated code generation based on configuration.

```typescript
// Generate code at build time
class CodeGenerator {
  constructor(private vfs: VirtualServer) {}
  
  generateRoutes(routes: Array<{ path: string; component: string }>) {
    const routeCode = `
// Auto-generated routes
import { RouteObject } from 'react-router-dom';
${routes.map(route => 
  `import ${route.component} from './${route.component}';`
).join('\n')}

export const routes: RouteObject[] = [
${routes.map(route => `
  {
    path: '${route.path}',
    element: <${route.component} />
  }`).join(',')}
];

export default routes;
`;
    
    this.vfs.set('/generated/routes.tsx', routeCode);
    return routeCode;
  }
  
  generateTypes(schema: Record<string, any>) {
    const typeCode = `
// Auto-generated types
${Object.entries(schema).map(([name, definition]) => {
  if (typeof definition === 'object' && definition.type === 'interface') {
    return `
export interface ${name} {
${Object.entries(definition.properties || {}).map(([prop, type]) => 
  `  ${prop}: ${type};`
).join('\n')}
}`;
  }
  return `export type ${name} = ${definition};`;
}).join('\n')}
`;
    
    this.vfs.set('/generated/types.ts', typeCode);
    return typeCode;
  }
  
  generateConstants(config: Record<string, any>) {
    const constantsCode = `
// Auto-generated constants
${Object.entries(config).map(([key, value]) => 
  `export const ${key.toUpperCase()} = ${JSON.stringify(value)};`
).join('\n')}

export const CONFIG = {
${Object.entries(config).map(([key, value]) => 
  `  ${key}: ${JSON.stringify(value)}`
).join(',\n')}
};

export default CONFIG;
`;
    
    this.vfs.set('/generated/constants.ts', constantsCode);
    return constantsCode;
  }
}

// Usage
const codeGen = new CodeGenerator(server.vfs);

// Generate routes
codeGen.generateRoutes([
  { path: '/', component: 'HomePage' },
  { path: '/about', component: 'AboutPage' },
  { path: '/contact', component: 'ContactPage' }
]);

// Generate types
codeGen.generateTypes({
  User: {
    type: 'interface',
    properties: {
      id: 'number',
      name: 'string',
      email: 'string',
      avatar: 'string | null'
    }
  },
  ApiResponse: 'T & { success: boolean; message?: string }'
});

// Generate constants
codeGen.generateConstants({
  apiUrl: 'https://api.example.com',
  version: '1.0.0',
  features: {
    darkMode: true,
    notifications: true
  }
});
```

### 4.6. Virtual File Management

This example shows how to create an advanced virtual file management system with metadata tracking. The system provides additional functionality like file listing, size tracking, and cleanup operations.

```typescript
// Manage virtual files with metadata
class VirtualFileManager {
  private metadata = new Map<string, { created: Date; modified: Date; size: number }>();
  
  constructor(private vfs: VirtualServer) {}
  
  set(filepath: string, contents: string) {
    const now = new Date();
    const existing = this.metadata.get(filepath);
    
    this.vfs.set(filepath, contents);
    
    this.metadata.set(filepath, {
      created: existing?.created || now,
      modified: now,
      size: contents.length
    });
    
    return this;
  }
  
  get(filepath: string) {
    return this.vfs.get(filepath);
  }
  
  has(filepath: string) {
    return this.vfs.has(filepath);
  }
  
  getMetadata(filepath: string) {
    return this.metadata.get(filepath);
  }
  
  list(pattern?: RegExp): Array<{ path: string; metadata: any }> {
    const files: Array<{ path: string; metadata: any }> = [];
    
    for (const [path, metadata] of this.metadata.entries()) {
      if (!pattern || pattern.test(path)) {
        files.push({ path, metadata });
      }
    }
    
    return files.sort((a, b) => a.path.localeCompare(b.path));
  }
  
  getTotalSize(): number {
    return Array.from(this.metadata.values())
      .reduce((total, meta) => total + meta.size, 0);
  }
  
  cleanup(olderThan: Date) {
    const toDelete: string[] = [];
    
    for (const [path, metadata] of this.metadata.entries()) {
      if (metadata.modified < olderThan) {
        toDelete.push(path);
      }
    }
    
    // Note: VirtualServer doesn't have a delete method
    // This is conceptual - you'd need to implement deletion
    console.log(`Would delete ${toDelete.length} old files`);
    
    return toDelete;
  }
}

// Usage
const fileManager = new VirtualFileManager(server.vfs);

// Add files with metadata tracking
fileManager.set('/temp/data.json', JSON.stringify({ temp: true }));
fileManager.set('/cache/user-123.json', JSON.stringify({ id: 123, name: 'John' }));

// List all files
const allFiles = fileManager.list();
console.log('All virtual files:', allFiles);

// List specific pattern
const tempFiles = fileManager.list(/^\/temp\//);
console.log('Temp files:', tempFiles);

// Get total size
console.log('Total virtual file size:', fileManager.getTotalSize(), 'bytes');

// Get file metadata
const metadata = fileManager.getMetadata('/temp/data.json');
console.log('File metadata:', metadata);
```

### 4.7. Integration with Vite

VirtualServer integrates seamlessly with Vite through custom plugins, enabling virtual file resolution and loading. This integration allows virtual files to be treated as regular modules in the build process.

```typescript
// Vite plugin for virtual files
function virtualFilePlugin(vfs: VirtualServer) {
  return {
    name: 'virtual-files',
    resolveId(id: string) {
      if (vfs.has(id)) {
        return id;
      }
    },
    load(id: string) {
      if (vfs.has(id)) {
        return vfs.get(id);
      }
    }
  };
}

// Use with Reactus
const server = new Server({
  plugins: [
    virtualFilePlugin(server.vfs)
  ]
});
```

### 4.8. Use Cases

VirtualServer is particularly useful for various development and build scenarios. This lightweight, in-memory file system integrates seamlessly with Reactus's build and development workflows.

**Development Scenarios**

 - **Development Tools**: Mock data, test fixtures, generated code
 - **Build-time Generation**: Routes, types, constants from configuration
 - **Template Systems**: Dynamic content generation
 - **Testing**: In-memory test files and fixtures

**Production Scenarios**

 - **Hot Reloading**: Temporary file storage during development
 - **Plugin Development**: Virtual file creation and manipulation

The VirtualServer provides a lightweight, in-memory file system that integrates seamlessly with Reactus's build and development workflows.
