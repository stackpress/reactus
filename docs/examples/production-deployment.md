# Production Deployment

This guide covers deploying Reactus applications to production environments, including build optimization, server configuration, and deployment strategies. Production deployment requires careful consideration of performance, security, scalability, and monitoring to ensure optimal application delivery.

 1. [Build Optimization](#1-build-optimization)
 2. [Production Server Setup](#2-production-server-setup)
 3. [Docker Deployment](#3-docker-deployment)
 4. [Cloud Platform Deployment](#4-cloud-platform-deployment)
 5. [Performance Monitoring](#5-performance-monitoring)
 6. [CI/CD Pipeline](#6-cicd-pipeline)

## 1. Build Optimization

Build optimization ensures optimal performance and efficient resource utilization in production environments. These configurations focus on minimizing bundle sizes, optimizing assets, and preparing applications for scalable deployment.

### 1.1. Production Build Configuration

The following example demonstrates comprehensive production build configuration with advanced optimizations, asset organization, and performance enhancements for deployment readiness.

```typescript
// scripts/build.ts
import { build } from 'reactus';
import { glob } from 'glob';
import path from 'path';
import fs from 'fs/promises';

async function buildApp() {
  const builder = build({
    cwd: process.cwd(),
    production: true,
    assetPath: './dist/assets',
    clientPath: './dist/client',
    pagePath: './dist/page',
    cssFiles: ['global.css'],
    vite: {
      build: {
        minify: 'terser',
        sourcemap: false,
        cssMinify: true,
        rollupOptions: {
          output: {
            manualChunks: {
              vendor: ['react', 'react-dom'],
              utils: ['lodash', 'date-fns']
            },
            assetFileNames: (assetInfo) => {
              const extType = assetInfo.name?.split('.').pop();
              if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType || '')) {
                return `images/[name]-[hash][extname]`;
              }
              if (/css/i.test(extType || '')) {
                return `css/[name]-[hash][extname]`;
              }
              return `assets/[name]-[hash][extname]`;
            },
            chunkFileNames: 'js/[name]-[hash].js',
            entryFileNames: 'js/[name]-[hash].js'
          }
        },
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true
          }
        }
      },
      define: {
        'process.env.NODE_ENV': '"production"'
      }
    }
  });

  // Find all pages
  const pageFiles = await glob('./pages/**/*.{tsx,jsx}');
  
  console.log(`Building ${pageFiles.length} pages for production...`);

  // Add all pages to manifest
  for (const file of pageFiles) {
    const entry = '@/' + path.relative(process.cwd(), file);
    await builder.set(entry);
  }

  // Build all components
  const startTime = Date.now();
  
  await builder.buildAllAssets();
  await builder.buildAllClients();
  await builder.buildAllPages();

  // Save manifest
  await builder.save('./dist/manifest.json');

  // Generate build info
  const buildInfo = {
    timestamp: new Date().toISOString(),
    pages: pageFiles.length,
    buildTime: Date.now() - startTime,
    version: process.env.npm_package_version || '1.0.0'
  };

  await fs.writeFile('./dist/build-info.json', JSON.stringify(buildInfo, null, 2));

  console.log(`✓ Production build completed in ${buildInfo.buildTime}ms`);
  console.log(`✓ Built ${buildInfo.pages} pages`);
  console.log(`✓ Assets saved to ./dist/`);
}

buildApp().catch((error) => {
  console.error('Build failed:', error);
  process.exit(1);
});
```

### 1.2. Environment Configuration

The following example shows how to configure environment-specific settings for production deployments, including security configurations, performance optimizations, and deployment-specific variables.

```typescript
// config/production.ts
export const productionConfig = {
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0'
  },
  paths: {
    assets: process.env.ASSET_PATH || './dist/assets',
    client: process.env.CLIENT_PATH || './dist/client',
    page: process.env.PAGE_PATH || './dist/page',
    manifest: process.env.MANIFEST_PATH || './dist/manifest.json'
  },
  cache: {
    maxAge: process.env.CACHE_MAX_AGE || '1y',
    immutable: true
  },
  compression: {
    enabled: process.env.COMPRESSION !== 'false',
    level: parseInt(process.env.COMPRESSION_LEVEL || '6')
  },
  security: {
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          fontSrc: ["'self'", "https:"]
        }
      }
    }
  }
};
```

## 2. Production Server Setup

Production server setup focuses on performance, security, and reliability for handling production traffic. These configurations ensure optimal request handling, asset serving, and error management.

### 2.1. Express Production Server

The following example demonstrates a complete Express production server with security middleware, compression, health checks, and optimized asset serving for scalable production deployment.

```typescript
// scripts/start.ts
import { serve } from 'reactus';
import express from 'express';
import compression from 'compression';
import helmet from 'helmet';
import { productionConfig } from '../config/production.js';
import path from 'path';
import fs from 'fs';

async function startServer() {
  const server = serve({
    cwd: process.cwd(),
    production: true,
    ...productionConfig.paths
  });

  // Load pre-built manifest
  await server.open(productionConfig.paths.manifest);

  const app = express();

  // Security middleware
  app.use(helmet(productionConfig.security.helmet));

  // Compression
  if (productionConfig.compression.enabled) {
    app.use(compression({
      level: productionConfig.compression.level,
      threshold: 1024
    }));
  }

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  // Serve static assets with caching
  app.use('/assets', express.static(productionConfig.paths.assets, {
    maxAge: productionConfig.cache.maxAge,
    immutable: productionConfig.cache.immutable,
    etag: true
  }));

  app.use('/client', express.static(productionConfig.paths.client, {
    maxAge: productionConfig.cache.maxAge,
    immutable: productionConfig.cache.immutable,
    etag: true
  }));

  // Serve public files
  app.use('/public', express.static('./public', {
    maxAge: '1d',
    etag: true
  }));

  // Routes
  app.get('/', async (req, res) => {
    try {
      const html = await server.render('@/pages/home', {
        title: 'Home',
        env: 'production'
      });
      
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutes
      res.end(html);
    } catch (error) {
      console.error('Render error:', error);
      res.status(500).send('Internal Server Error');
    }
  });

  app.get('/about', async (req, res) => {
    try {
      const html = await server.render('@/pages/about');
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour
      res.end(html);
    } catch (error) {
      console.error('Render error:', error);
      res.status(500).send('Internal Server Error');
    }
  });

  // 404 handler
  app.use(async (req, res) => {
    try {
      const html = await server.render('@/pages/404', {
        path: req.path
      });
      res.status(404).setHeader('Content-Type', 'text/html').end(html);
    } catch (error) {
      res.status(404).send('Page not found');
    }
  });

  // Error handler
  app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Server error:', err);
    res.status(500).send('Internal Server Error');
  });

  // Graceful shutdown
  const gracefulShutdown = () => {
    console.log('Received shutdown signal, closing server...');
    process.exit(0);
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);

  const { port, host } = productionConfig.server;
  app.listen(port, host, () => {
    console.log(`Production server running at http://${host}:${port}`);
    console.log(`Process ID: ${process.pid}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
```

### 2.2. PM2 Configuration

The following example shows how to configure PM2 for production process management, including clustering, monitoring, deployment automation, and environment-specific configurations.

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'reactus-app',
    script: './dist/start.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      COMPRESSION: 'true',
      CACHE_MAX_AGE: '1y'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }],

  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:your-username/your-repo.git',
      path: '/var/www/reactus-app',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
```

## 3. Docker Deployment

Docker deployment provides containerized application delivery with consistent environments across development and production. These configurations ensure efficient builds, security, and scalability.

### 3.1. Multi-stage Dockerfile

The following example demonstrates a multi-stage Docker build process that separates build dependencies from runtime, resulting in optimized production images with minimal attack surface.

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Build application
RUN yarn build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
COPY yarn.lock ./
RUN yarn install --frozen-lockfile --production && yarn cache clean

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S reactus -u 1001

# Change ownership
RUN chown -R reactus:nodejs /app
USER reactus

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start application
CMD ["node", "dist/start.js"]
```

### 3.2. Docker Compose

The following example shows how to orchestrate Reactus applications with Docker Compose, including reverse proxy configuration, health checks, and service coordination.

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "healthcheck.js"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped
```

### 3.3. Nginx Configuration

The following example demonstrates Nginx configuration for production load balancing, SSL termination, static asset serving, and security headers for optimal performance.

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3000;
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    server {
        listen 80;
        server_name your-domain.com;

        # Redirect to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        # Static assets with long cache
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            proxy_pass http://app;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # API routes
        location /api/ {
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # All other routes
        location / {
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # Cache HTML for 5 minutes
            proxy_cache_valid 200 5m;
        }
    }
}
```

## 4. Cloud Platform Deployment

Cloud platform deployment leverages managed services for scalable, reliable application hosting. These configurations provide platform-specific optimizations and deployment strategies.

### 4.1. Vercel Deployment

The following example shows how to deploy Reactus applications to Vercel with optimized routing, caching strategies, and environment configuration for serverless deployment.

```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "scripts/start.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/assets/(.*)",
      "dest": "/dist/assets/$1",
      "headers": {
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    },
    {
      "src": "/client/(.*)",
      "dest": "/dist/client/$1",
      "headers": {
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    },
    {
      "src": "/(.*)",
      "dest": "/scripts/start.ts"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### 4.2. Railway Deployment

The following example demonstrates Railway deployment configuration with Docker support, environment management, and automated deployment pipelines for cloud-native applications.

```dockerfile
# railway.dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE $PORT

CMD ["npm", "start"]
```

### 4.3. Heroku Deployment

The following example shows Heroku deployment configuration with buildpack optimization, environment management, and process scaling for platform-as-a-service deployment.

```json
// package.json (scripts section)
{
  "scripts": {
    "build": "tsx scripts/build.ts",
    "start": "node dist/start.js",
    "heroku-postbuild": "npm run build"
  },
  "engines": {
    "node": "18.x"
  }
}
```

```
# Procfile
web: npm start
```

## 5. Performance Monitoring

Performance monitoring provides insights into application behavior, resource utilization, and user experience in production environments. These tools enable proactive optimization and issue resolution.

### 5.1. Health Check Endpoint

The following example demonstrates comprehensive health check implementation for monitoring application status, dependencies, and system resources in production environments.

```typescript
// healthcheck.js
const http = require('http');

const options = {
  hostname: 'localhost',
  port: process.env.PORT || 3000,
  path: '/health',
  method: 'GET',
  timeout: 2000
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

req.on('error', () => {
  process.exit(1);
});

req.on('timeout', () => {
  req.destroy();
  process.exit(1);
});

req.end();
```

### 5.2. Logging Configuration

The following example shows production logging configuration with structured logging, log levels, and centralized log management for effective monitoring and debugging.

```typescript
// utils/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'reactus-app' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

export default logger;
```

## 6. CI/CD Pipeline

CI/CD pipeline automation ensures consistent, reliable deployments with automated testing, building, and deployment processes. These configurations provide robust deployment workflows.

The following example demonstrates comprehensive GitHub Actions workflow for automated testing, building, and deployment with environment-specific configurations and security best practices.

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm test

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist/

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: actions/download-artifact@v3
        with:
          name: dist
          path: dist/
      - name: Deploy to server
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /var/www/reactus-app
            git pull origin main
            npm ci --only=production
            npm run build
            pm2 reload ecosystem.config.js
```

This comprehensive guide covers all aspects of deploying Reactus applications to production, from build optimization to monitoring and CI/CD pipelines, ensuring scalable and reliable application delivery.
