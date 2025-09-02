# Express Integration

This guide shows how to integrate Reactus with Express.js for server-side rendering with client-side hydration. Express.js provides a robust web framework foundation while Reactus handles the React component rendering and build processes for optimal performance and developer experience.

 1. [Basic Setup](#1-basic-setup)
 2. [Advanced Features](#2-advanced-features)
 3. [Production Build](#3-production-build)
 4. [Production Server](#4-production-server)

## 1. Basic Setup

Basic setup involves installing dependencies, creating page components, and configuring the development server. This foundation provides server-side rendering with hot module replacement for efficient development workflows.

### 1.1. Install Dependencies

Install reactus and express using the following commands below.

```bash
npm install reactus express
npm install -D @types/express tsx
```

### 1.2. Create Page Components

This section demonstrates how to create React components that work with Reactus server-side rendering. Components include Head functions for metadata and support both server and client rendering.

```tsx
// pages/home.tsx
import { useState } from 'react';
import './page.css';

export function Head({ title }: { title?: string }) {
  return (
    <>
      <title>{title || 'Home'}</title>
      <meta name="description" content="Welcome to our app" />
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      <link rel="stylesheet" type="text/css" href="/global.css" />
    </>
  );
}

export default function HomePage({ title, user }: { 
  title: string;
  user?: { name: string; email: string };
}) {
  const [count, setCount] = useState(0);

  return (
    <div className="container">
      <h1>{title}</h1>
      {user && (
        <div className="user-info">
          <p>Welcome, {user.name}!</p>
          <p>Email: {user.email}</p>
        </div>
      )}
      <div className="counter">
        <button onClick={() => setCount(count + 1)}>
          Count: {count}
        </button>
      </div>
    </div>
  );
}
```

```tsx
// pages/about.tsx
export function Head() {
  return (
    <>
      <title>About Us</title>
      <meta name="description" content="Learn about our company" />
    </>
  );
}

export default function AboutPage() {
  return (
    <div className="container">
      <h1>About Us</h1>
      <p>We build amazing web applications with Reactus.</p>
    </div>
  );
}
```

### 1.3. Development Server

This example demonstrates how to set up a complete Express development server with Reactus integration. The server provides hot module replacement, asset serving, routing, and comprehensive error handling for an optimal development experience.

```typescript
// scripts/develop.ts
import { dev } from 'reactus';
import express from 'express';
import path from 'path';

async function develop() {
  const engine = dev({
    cwd: process.cwd(),
    basePath: '/',
    clientRoute: '/client',
    cssRoute: '/assets',
    cssFiles: ['global.css']
  });

  const app = express();

  // Serve static files
  app.use('/public', express.static(path.join(process.cwd(), 'public')));

  // Handle Reactus assets and HMR
  app.use(async (req, res, next) => {
    await engine.http(req, res);
    if (res.headersSent) return;
    next();
  });

  // Routes
  app.get('/', async (req, res) => {
    try {
      const html = await engine.render('@/pages/home', {
        title: 'Welcome Home',
        user: { name: 'John Doe', email: 'john@example.com' }
      });
      res.setHeader('Content-Type', 'text/html');
      res.end(html);
    } catch (error) {
      console.error('Render error:', error);
      res.status(500).send('Internal Server Error');
    }
  });

  app.get('/about', async (req, res) => {
    try {
      const html = await engine.render('@/pages/about');
      res.setHeader('Content-Type', 'text/html');
      res.end(html);
    } catch (error) {
      console.error('Render error:', error);
      res.status(500).send('Internal Server Error');
    }
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).send('Page not found');
  });

  // Error handler
  app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Express error:', err);
    res.status(500).send('Internal Server Error');
  });

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Development server running at http://localhost:${port}`);
  });
}

develop().catch(console.error);
```

This section shows how to configure the Express development server with Reactus integration. The server handles asset serving, HMR, routing, and error handling for a complete development experience.

## 2. Advanced Features

Advanced features extend the basic setup with dynamic routing, middleware integration, and sophisticated request handling. These features enable complex application architectures while maintaining optimal performance.

### 2.1. Dynamic Routing

This example shows how to implement dynamic routing patterns with Express and Reactus. Dynamic routes enable data-driven pages, user profiles, blog posts, and other content that depends on URL parameters and external data sources.

```typescript
// scripts/develop.ts (extended)
import { dev } from 'reactus';
import express from 'express';

async function develop() {
  const engine = dev({ /* config */ });
  const app = express();

  // Handle assets
  app.use(async (req, res, next) => {
    await engine.http(req, res);
    if (res.headersSent) return;
    next();
  });

  // Dynamic user profiles
  app.get('/user/:id', async (req, res) => {
    const userId = req.params.id;
    
    try {
      // Fetch user data (mock)
      const user = await getUserById(userId);
      
      if (!user) {
        return res.status(404).send('User not found');
      }

      const html = await engine.render('@/pages/user-profile', {
        user,
        title: `${user.name}'s Profile`
      });
      
      res.setHeader('Content-Type', 'text/html');
      res.end(html);
    } catch (error) {
      console.error('User profile error:', error);
      res.status(500).send('Internal Server Error');
    }
  });

  // Blog posts with dynamic content
  app.get('/blog/:slug', async (req, res) => {
    const slug = req.params.slug;
    
    try {
      const post = await getPostBySlug(slug);
      
      if (!post) {
        return res.status(404).send('Post not found');
      }

      const html = await engine.render('@/pages/blog-post', {
        post,
        title: post.title,
        meta: {
          description: post.excerpt,
          author: post.author
        }
      });
      
      res.setHeader('Content-Type', 'text/html');
      res.end(html);
    } catch (error) {
      console.error('Blog post error:', error);
      res.status(500).send('Internal Server Error');
    }
  });
}

// Mock data functions
async function getUserById(id: string) {
  // In real app, fetch from database
  return {
    id,
    name: 'John Doe',
    email: 'john@example.com',
    avatar: '/avatars/john.jpg'
  };
}

async function getPostBySlug(slug: string) {
  // In real app, fetch from CMS or database
  return {
    slug,
    title: 'Getting Started with Reactus',
    excerpt: 'Learn how to build modern web apps with Reactus',
    content: '<p>Reactus is a powerful template engine...</p>',
    author: 'Jane Smith',
    publishedAt: new Date().toISOString()
  };
}
```

This section demonstrates how to implement dynamic routing with Express and Reactus. Dynamic routes enable data-driven pages, user profiles, and content management scenarios.

### 2.2. Middleware Integration

This example demonstrates comprehensive middleware integration including security headers, CORS, session management, authentication, and body parsing. The middleware stack provides enterprise-grade functionality for production applications.

```typescript
// scripts/develop.ts (with middleware)
import { dev } from 'reactus';
import express from 'express';
import session from 'express-session';
import cors from 'cors';
import helmet from 'helmet';

async function develop() {
  const engine = dev({ /* config */ });
  const app = express();

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"]
      }
    }
  }));

  // CORS
  app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true
  }));

  // Session management
  app.use(session({
    secret: process.env.SESSION_SECRET || 'dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true in production with HTTPS
  }));

  // Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Authentication middleware
  const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!req.session.user) {
      return res.redirect('/login');
    }
    next();
  };

  // Reactus middleware
  app.use(async (req, res, next) => {
    await engine.http(req, res);
    if (res.headersSent) return;
    next();
  });

  // Public routes
  app.get('/', async (req, res) => {
    const html = await engine.render('@/pages/home', {
      title: 'Home',
      user: req.session.user || null
    });
    res.setHeader('Content-Type', 'text/html');
    res.end(html);
  });

  app.get('/login', async (req, res) => {
    if (req.session.user) {
      return res.redirect('/dashboard');
    }
    
    const html = await engine.render('@/pages/login', {
      title: 'Login'
    });
    res.setHeader('Content-Type', 'text/html');
    res.end(html);
  });

  // Protected routes
  app.get('/dashboard', requireAuth, async (req, res) => {
    const html = await engine.render('@/pages/dashboard', {
      title: 'Dashboard',
      user: req.session.user
    });
    res.setHeader('Content-Type', 'text/html');
    res.end(html);
  });

  // API routes
  app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    
    // Validate credentials (mock)
    if (email === 'user@example.com' && password === 'password') {
      req.session.user = { email, name: 'John Doe' };
      res.json({ success: true });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });

  app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Logout failed' });
      }
      res.json({ success: true });
    });
  });

  app.listen(3000, () => {
    console.log('Server running at http://localhost:3000');
  });
}
```

### 2.3. Error Handling

This example shows how to implement robust error handling patterns for Express and Reactus applications. The error handling system includes custom error classes, async error catching, and error page rendering for better user experience.

```typescript
// utils/error-handler.ts
import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const errorHandler = async (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
  engine: any
) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error(err);

  // Default error
  let statusCode = 500;
  let message = 'Internal Server Error';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // Render error page
  try {
    const html = await engine.render('@/pages/error', {
      title: 'Error',
      error: {
        statusCode,
        message: process.env.NODE_ENV === 'development' ? err.message : message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      }
    });
    
    res.status(statusCode).setHeader('Content-Type', 'text/html').end(html);
  } catch (renderError) {
    console.error('Error rendering error page:', renderError);
    res.status(statusCode).send(message);
  }
};
```

This section shows how to integrate various Express middleware with Reactus for enhanced functionality. Middleware integration includes security, sessions, authentication, and request processing.

## 3. Production Build

This section demonstrates how to build Reactus applications for production deployment with Express. The build process includes asset optimization, manifest generation, and preparation for efficient production serving.

```typescript
// scripts/build.ts
import { build } from 'reactus';
import { glob } from 'glob';
import path from 'path';

async function buildApp() {
  const builder = build({
    cwd: process.cwd(),
    production: true,
    assetPath: './dist/assets',
    clientPath: './dist/client',
    pagePath: './dist/page',
    vite: {
      build: {
        minify: 'terser',
        sourcemap: false,
        rollupOptions: {
          output: {
            manualChunks: {
              vendor: ['react', 'react-dom'],
              utils: ['lodash', 'date-fns']
            }
          }
        }
      }
    }
  });

  // Find all pages
  const pageFiles = await glob('./pages/**/*.{tsx,jsx}');
  
  // Add to manifest
  for (const file of pageFiles) {
    const entry = '@/' + path.relative(process.cwd(), file);
    await builder.set(entry);
  }

  console.log(`Building ${pageFiles.length} pages...`);

  // Build all
  await builder.buildAllAssets();
  await builder.buildAllClients();
  await builder.buildAllPages();

  // Save manifest
  await builder.save('./dist/manifest.json');

  console.log('Build complete!');
}

buildApp().catch(console.error);
```

This section demonstrates how to build Reactus applications for production deployment. The build process optimizes assets, generates manifests, and prepares files for efficient serving.

## 4. Production Server

This section shows how to configure and run a production Express server with optimized Reactus assets. The production setup focuses on performance, static asset serving, and efficient request handling for scalable deployments.

```typescript
// scripts/start.ts
import { serve } from 'reactus';
import express from 'express';
import path from 'path';

async function startServer() {
  const server = serve({
    cwd: process.cwd(),
    production: true,
    assetPath: './dist/assets',
    clientPath: './dist/client',
    pagePath: './dist/page'
  });

  // Load pre-built manifest
  await server.open('./dist/manifest.json');

  const app = express();

  // Serve static assets
  app.use('/assets', express.static('./dist/assets'));
  app.use('/client', express.static('./dist/client'));
  app.use('/public', express.static('./public'));

  // Routes
  app.get('/', async (req, res) => {
    const html = await server.render('@/pages/home', {
      title: 'Home'
    });
    res.setHeader('Content-Type', 'text/html');
    res.end(html);
  });

  app.get('/about', async (req, res) => {
    const html = await server.render('@/pages/about');
    res.setHeader('Content-Type', 'text/html');
    res.end(html);
  });

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Production server running at http://localhost:${port}`);
  });
}

startServer().catch(console.error);
```

This section shows how to configure and run a production Express server with pre-built Reactus assets. The production server focuses on performance, caching, and efficient asset delivery.

This Express integration provides a complete setup for both development and production environments with Reactus, enabling scalable web applications with server-side rendering and optimal performance.
