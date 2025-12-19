# Server

The main server class that orchestrates the Reactus template engine. Server manages document rendering, asset handling, and HTTP middleware integration for both development and production environments.

This class serves as the primary interface for integrating Reactus with web frameworks like Express, Fastify, or Node.js HTTP servers. It provides methods for configuration, request handling, and accessing internal components like the loader, manifest, and resource manager.

```typescript
import { Server } from 'reactus';

const server = new Server({
  cwd: process.cwd(),
  basePath: '/',
  clientRoute: '/client',
  production: false
});
```

 1. [Static Methods](#1-static-methods)
 2. [Properties](#2-properties)
 3. [Methods](#3-methods)
 4. [Configuration Options](#4-configuration-options)
 5. [Usage Examples](#5-usage-examples)
 6. [Error Handling](#6-error-handling)

## 1. Static Methods

The following methods can be accessed directly from the Server class itself without instantiation. These methods provide utilities for configuration management and setup operations.

### 1.1. Configuring Server Options

Merges provided configuration options with sensible defaults to create a complete server configuration. This method ensures all required properties are set and validates the configuration before use.

```typescript
const config = Server.configure({
  cwd: process.cwd(),
  basePath: '/',
  clientRoute: '/client',
  production: false
});
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `options` | `Partial<ServerConfig>` | Configuration options to merge with defaults |

**Returns**

A frozen ServerConfig object with all required properties set and validated.

## 2. Properties

The following properties are available when instantiating a Server. These properties provide access to the internal components that handle different aspects of the server's functionality.

| Property | Type | Description |
|----------|------|-------------|
| `loader` | `ServerLoader` | File system loader for resolving and importing modules |
| `manifest` | `ServerManifest` | Document manifest for managing page entries |
| `production` | `boolean` | Whether the server is running in production mode |
| `resource` | `ServerResource` | Vite integration for asset handling and development |
| `vfs` | `VirtualServer` | Virtual file system for in-memory file operations |

## 3. Methods

The following methods are available when instantiating a Server. These methods provide access to configuration data and handle HTTP request processing.

### 3.1. Getting Server Paths

Returns the configured paths for assets, client scripts, pages, and CSS files. This method provides access to the internal path configuration used by the server.

```typescript
const paths = server.paths;
console.log(paths.asset);  // '/project/.reactus/assets'
console.log(paths.client); // '/project/.reactus/client'
console.log(paths.page);   // '/project/.reactus/page'
console.log(paths.css);    // ['global.css'] or undefined
```

**Returns**

A frozen object containing asset, client, page paths and optional CSS files array.

### 3.2. Getting Route Configurations

Returns the configured route prefixes for client scripts and CSS assets. These routes determine how assets are served and accessed by browsers.

```typescript
const routes = server.routes;
console.log(routes.client); // '/client'
console.log(routes.css);    // '/assets'
```

**Returns**

A frozen object containing client and CSS route prefixes.

### 3.3. Getting Template Configurations

Returns the configured template strings for client, document, and page generation. These templates define how different types of code are wrapped and structured.

```typescript
const templates = server.templates;
console.log(templates.client);   // Client template string
console.log(templates.document); // Document template string
console.log(templates.page);     // Page template string
```

**Returns**

A frozen object containing client, document, and page template strings.

### 3.4. Handling HTTP Requests

Processes HTTP requests through the server's middleware pipeline. This method handles asset serving, hot module replacement, and other development features automatically.

```typescript
import express from 'express';

const app = express();

app.use(async (req, res, next) => {
  await server.http(req, res);
  if (res.headersSent) return;
  next();
});
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `req` | `IncomingMessage` | Node.js HTTP request object |
| `res` | `ServerResponse` | Node.js HTTP response object |

**Returns**

A promise that resolves when middleware processing is complete.

## 4. Configuration Options

The Server.configure() method accepts comprehensive configuration options for customizing server behavior. These options are organized into categories for different aspects of server operation.

### 4.1. Basic Configuration

Essential configuration options that define the server's core behavior and operating mode. These options are required for proper server operation.

```typescript
const config = Server.configure({
  cwd: process.cwd(),           // Working directory
  basePath: '/',                // Base path for routing
  clientRoute: '/client',       // Client assets route
  cssRoute: '/assets',          // CSS assets route
  production: false             // Production mode flag
});
```

### 4.2. Path Configuration

Configuration options that define where files are located and where build outputs should be saved. These paths form the foundation of the server's file system operations.

```typescript
const config = Server.configure({
  assetPath: '/custom/assets',   // Custom asset output path
  clientPath: '/custom/client',  // Custom client output path
  pagePath: '/custom/page'       // Custom page output path
});
```

### 4.3. Template Configuration

Configuration options for customizing the templates used to wrap different types of generated code. Templates define the structure and scaffolding for client, document, and page code.

```typescript
const config = Server.configure({
  clientTemplate: 'custom client template',
  documentTemplate: 'custom document template',
  pageTemplate: 'custom page template'
});
```

### 4.4. Vite Integration

Configuration options for integrating with Vite's development server and build system. These options allow you to customize Vite's behavior and add plugins.

```typescript
const config = Server.configure({
  plugins: [
    // Vite plugins
  ],
  vite: {
    // Vite configuration
    define: { __DEV__: true },
    server: { port: 3000 }
  },
  optimizeDeps: {
    include: ['react', 'react-dom']
  }
});
```

### 4.5. CSS Configuration

Configuration options for handling CSS files and styling. These options control how global CSS files are included and served.

```typescript
const config = Server.configure({
  cssFiles: ['global.css', 'theme.css'], // Global CSS files
  cssRoute: '/styles'                     // CSS serving route
});
```

### 4.6. Development Configuration

Configuration options specific to development mode, including file watching and custom file system interfaces. These options optimize the development experience.

```typescript
const config = Server.configure({
  watchIgnore: ['node_modules', '.git'], // Files to ignore in watch mode
  fs: new CustomFileSystem()             // Custom file system implementation
});
```

## 5. Usage Examples

These examples demonstrate common integration patterns and use cases for the Server class. Each example shows how to integrate Reactus with different web frameworks and deployment scenarios.

### 5.1. Express.js Integration

This example shows how to integrate the Server class with Express.js for a complete web application. It demonstrates middleware setup and page rendering.

```typescript
import { Server } from 'reactus';
import express from 'express';

const server = new Server(Server.configure({
  cwd: process.cwd(),
  basePath: '/',
  clientRoute: '/client'
}));

const app = express();

// Handle assets and HMR
app.use(async (req, res, next) => {
  await server.http(req, res);
  if (res.headersSent) return;
  next();
});

// Render pages
app.get('/', async (req, res) => {
  const document = await server.manifest.get('@/pages/home');
  const html = await document.render.renderMarkup({ title: 'Home' });
  res.setHeader('Content-Type', 'text/html');
  res.end(html);
});
```

### 5.2. Fastify Integration

This example demonstrates how to use the Server class with Fastify, showing how to register middleware and handle requests in Fastify's plugin system.

```typescript
import { Server } from 'reactus';
import Fastify from 'fastify';

const server = new Server(Server.configure({
  cwd: process.cwd(),
  production: false
}));

const fastify = Fastify();

// Register middleware
fastify.addHook('onRequest', async (request, reply) => {
  await server.http(request.raw, reply.raw);
});

// Register routes
fastify.get('/', async (request, reply) => {
  const document = await server.manifest.get('@/pages/home');
  const html = await document.render.renderMarkup();
  reply.type('text/html').send(html);
});
```

### 5.3. Production Mode

This example shows how to configure the Server class for production deployment with pre-built assets and optimized performance settings.

```typescript
const server = new Server(Server.configure({
  cwd: process.cwd(),
  production: true,
  assetPath: '/app/dist/assets',
  clientPath: '/app/dist/client',
  pagePath: '/app/dist/page'
}));

// In production, assets are pre-built
const document = await server.manifest.get('@/pages/home');
const html = await document.render.renderMarkup(props);
```

### 5.4. Custom File System

This example demonstrates how to use a custom file system interface for specialized deployment environments or testing scenarios.

```typescript
import { FileSystem } from '@stackpress/lib/types';

class CustomFS implements FileSystem {
  // Implement required methods
}

const server = new Server(Server.configure({
  fs: new CustomFS(),
  cwd: '/custom/path'
}));
```

## 6. Error Handling

The Server class propagates errors from its components and provides meaningful error messages for debugging. Understanding common error patterns helps with troubleshooting and development.

### 6.1. Common Error Patterns

The Server class can throw errors from various components during operation. Each error type indicates a specific issue that needs to be addressed.

```typescript
try {
  const server = new Server(config);
  await server.http(req, res);
} catch (error) {
  if (error.message.includes('ServerResource failed')) {
    // Handle Vite integration errors
  } else if (error.message.includes('ServerLoader failed')) {
    // Handle file system errors
  } else {
    // Handle other errors
  }
}
```

### 6.2. Component Integration

The Server class integrates several components that each handle specific aspects of the framework's functionality. Understanding these components helps with debugging and advanced use cases.

Each component is accessible through the server instance and can be used independently for advanced use cases:

 - **ServerLoader**: Handles file system operations and module resolution
 - **ServerManifest**: Manages document entries and caching
 - **ServerResource**: Provides Vite integration for assets and development
 - **VirtualServer**: Manages in-memory file operations
