# Reactus

A React-based template engine that renders "mini-apps" with server-side props. Reactus provides reactive templating with Vite integration, allowing you to build modern React applications without the complexity of traditional frontend frameworks.

This documentation covers the core concepts, installation process, configuration options, and practical examples for getting started with Reactus. You'll learn how to set up both development and production environments, integrate with popular frameworks, and leverage the full power of server-side rendering with client-side hydration.

 1. [Key Features](#1-key-features)
 2. [Installation and Quick Start](#2-installation-and-quick-start)
 3. [Core Concepts](#3-core-concepts)
 4. [API Overview](#4-api-overview)
 5. [Configuration](#5-configuration)
 6. [Examples and Documentation](#6-examples-and-documentation)

## 1. Key Features

Reactus provides a streamlined approach to React development by eliminating common complexities while maintaining the power and flexibility of modern React applications. The framework focuses on simplicity and performance through server-side rendering.

The following features make Reactus unique in the React ecosystem:

 - **No frontend server** - Server-side rendering with client-side hydration
 - **No global state management needed** - Pass props directly from server
 - **No memoization needed** - Optimized rendering out of the box
 - **No suspense needed** - Simplified async handling
 - **No frontend routing system** - Use your existing backend routing
 - **Vite plugin support** - Use any Vite plugin for enhanced development
 - **Ejectable for production** - Full control over build process

## 2. Installation and Quick Start

This section walks you through the complete setup process from installation to running your first Reactus application. The quick start guide demonstrates the essential steps needed to create a functional React application with server-side rendering.

### 2.1. Installation

Install Reactus using your preferred package manager. The framework requires Node.js 16 or higher and works with both npm and yarn.

```bash
npm install reactus
# or
yarn add reactus
```

### 2.2. Create a React Page Component

Create your first page component with both server-side and client-side functionality. This example demonstrates the basic structure of a Reactus page with a Head export for metadata and interactive client-side state.

```tsx
// pages/home.tsx
import { useState } from 'react';

export function Head() {
  return (
    <>
      <title>My App</title>
      <meta name="description" content="My Reactus App" />
    </>
  );
}

export default function HomePage({ title }: { title: string }) {
  const [count, setCount] = useState(0);

  return (
    <div>
      <h1>{title}</h1>
      <button onClick={() => setCount(count + 1)}>
        Count: {count}
      </button>
    </div>
  );
}
```

### 2.3. Set Up Development Server

Configure a development server that integrates Reactus with your preferred Node.js framework. This example uses Express.js but the same pattern works with Fastify, Koa, or plain Node.js HTTP servers.

```typescript
// scripts/develop.ts
import { dev } from 'reactus';
import express from 'express';

async function develop() {
  const engine = dev({
    cwd: process.cwd(),
    basePath: '/',
    clientRoute: '/client',
  });

  const app = express();

  // Handle assets and HMR
  app.use(async (req, res, next) => {
    await engine.http(req, res);
    if (res.headersSent) return;
    next();
  });

  // Render pages
  app.get('/', async (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.end(await engine.render('@/pages/home', { title: 'Welcome!' }));
  });

  app.listen(3000, () => {
    console.log('Server running at http://localhost:3000');
  });
}

develop().catch(console.error);
```

### 2.4. Run Development Server

Start your development server with hot module replacement and automatic reloading. The development server provides instant feedback during development with full React DevTools support.

```bash
npx tsx scripts/develop.ts
```

## 3. Core Concepts

Reactus is built around three fundamental concepts that simplify React development while maintaining performance and flexibility. Understanding these concepts is essential for effectively using the framework in your projects.

### 3.1. Server-Side Rendering with Client Hydration

Reactus renders your React components on the server and sends complete HTML to the browser. The client-side JavaScript then hydrates the page, making it interactive while preserving the server-rendered content.

This approach provides the best of both worlds: fast initial page loads with SEO benefits from server-side rendering, and rich interactivity from client-side React. The hydration process is automatic and requires no additional configuration.

### 3.2. Props-Based Architecture

Instead of complex state management systems, Reactus uses a simple props-based approach where data flows directly from the server to components. This eliminates the need for global state management libraries in most cases.

```typescript
// Server passes props directly to components
await engine.render('@/pages/user-profile', {
  user: { id: 1, name: 'John' },
  posts: await getUserPosts(1)
});
```

### 3.3. File-Based Organization

Organize your components and pages using a simple, intuitive file structure that mirrors your application's routing and component hierarchy. This approach makes it easy to locate and maintain your code as your application grows.

```
project/
├── pages/           # Page components
│   ├── home.tsx
│   └── about.tsx
├── components/      # Reusable components
│   └── Header.tsx
└── scripts/         # Build and dev scripts
    ├── develop.ts
    ├── build.ts
    └── start.ts
```

## 4. API Overview

Reactus provides three main functions that correspond to different phases of your application lifecycle. Each function is optimized for its specific use case and provides the necessary tools for that phase of development or deployment.

### 4.1. Development Mode

The development mode provides hot module replacement, automatic reloading, and integration with Vite's development server. This mode is optimized for fast iteration and debugging during development.

```typescript
import { dev } from 'reactus';

const engine = dev({
  cwd: process.cwd(),
  basePath: '/',
  clientRoute: '/client'
});

// Render pages with HMR support
await engine.render('@/pages/home', props);
```

### 4.2. Build Mode

The build mode compiles your application for production, generating optimized assets, client-side bundles, and server-side page modules. This mode focuses on performance optimization and bundle size reduction.

```typescript
import { build } from 'reactus';

const builder = build({
  cwd: process.cwd(),
  production: false
});

// Build assets, clients, and pages
await builder.buildAllAssets();
await builder.buildAllClients();
await builder.buildAllPages();
```

### 4.3. Production Mode

The production mode serves pre-built pages and assets with optimal performance. This mode is designed for deployment environments where build artifacts are already generated and cached.

```typescript
import { serve } from 'reactus';

const server = serve({
  cwd: process.cwd(),
  production: true
});

// Render pre-built pages
await server.render('@/pages/home', props);
```

## 5. Configuration

Reactus provides flexible configuration options for different modes of operation. Each mode has its own configuration interface with specific required and optional fields that allow you to customize the framework's behavior for your specific needs.

### 5.1. Configuration Overview

The configuration system is designed to be mode-specific, allowing you to optimize settings for development, build, or production environments. Each configuration type includes sensible defaults while providing the flexibility to customize every aspect of the framework's behavior.

**Basic Configuration Example**

```typescript
// Development mode
const devConfig = {
  cwd: process.cwd(),           // Working directory
  basePath: '/',                // Base path for routing
  clientRoute: '/client',       // Client assets route
  clientTemplate: '...',        // Client script wrapper
  documentTemplate: '...',      // HTML document template
  plugins: [],                  // Vite plugins
  cssFiles: ['global.css'],     // Global CSS files
  vite: {                       // Custom Vite options
    // Additional Vite configuration
  }
};

// Production mode
const prodConfig = {
  cwd: process.cwd(),
  clientRoute: '/client',       // Client assets route
  cssRoute: '/assets',          // CSS assets route
  documentTemplate: '...',      // HTML document template
  pagePath: './dist/pages',     // Pre-built pages location
  plugins: []                   // Minimal plugins for production
};
```

### 5.2. Complete Configuration Reference

For a comprehensive list of all configuration options, including detailed descriptions, types, and examples for each mode, see the [Configuration Documentation](./configuration.md).

Key configuration categories include path configuration for working directories and build output paths, route configuration for URL prefixes, template configuration for HTML and script wrappers, plugin configuration for Vite plugins and optimization settings, and file system configuration for custom interfaces and global CSS.

## 6. Examples and Documentation

Reactus includes comprehensive examples and documentation to help you get started quickly and implement advanced features. The examples cover common integration patterns and use cases you'll encounter in real-world applications.

### 6.1. Working Examples

The `examples/` directory contains working examples for different setups that demonstrate best practices and integration patterns:

 - **with-express** - Express.js integration
 - **with-fastify** - Fastify integration
 - **with-http** - Node.js HTTP server
 - **with-tailwind** - Tailwind CSS integration
 - **with-unocss** - UnoCSS integration

### 6.2. API Documentation

Complete API documentation is available for all core classes and functions. Each API document includes detailed method signatures, parameter descriptions, return values, and practical examples:

 - [Configuration Options](./configuration.md) - Complete configuration reference
 - [Server API](./api/Server.md) - Main server class
 - [Builder API](./api/Builder.md) - Build system
 - [Document API](./api/Document.md) - Document management
 - [DocumentBuilder API](./api/DocumentBuilder.md) - Document building
 - [DocumentLoader API](./api/DocumentLoader.md) - Module loading
 - [DocumentRender API](./api/DocumentRender.md) - Rendering system
 - [ServerManifest API](./api/ServerManifest.md) - Manifest management
 - [ServerResource API](./api/ServerResource.md) - Vite integration
 - [VirtualServer API](./api/VirtualServer.md) - Virtual file system

### 6.3. Use Case Guides

Detailed guides for common use cases and integration patterns help you implement specific features and solve common challenges:

 - [Express Integration](./examples/express-integration.md)
 - [Static Site Generation](./examples/static-site-generation.md)
 - [CSS Framework Integration](./examples/css-frameworks.md)
 - [Custom Build Pipeline](./examples/custom-build.md)
 - [Production Deployment](./examples/production-deployment.md)
