# Static Site Generation with Reactus

This guide demonstrates how to use Reactus for static site generation (SSG), creating pre-rendered HTML files that can be served from any static hosting provider. Static site generation combines the benefits of server-side rendering with the simplicity of static hosting for optimal performance and deployment flexibility.

 1. [Overview](#1-overview)
 2. [Basic Static Generation](#2-basic-static-generation)
 3. [Advanced Static Generation](#3-advanced-static-generation)
 4. [Data-Driven Generation](#4-data-driven-generation)
 5. [Build Optimization](#5-build-optimization)
 6. [Deployment Examples](#6-deployment-examples)
 7. [Package.json Scripts](#7-packagejson-scripts)
 8. [Best Practices](#8-best-practices)

## 1. Overview

Reactus can generate static HTML files for all your pages at build time, providing exceptional performance and deployment flexibility. Static site generation enables modern development workflows while delivering optimized static assets.

**Static Generation Benefits**

 - **Fast Loading**: Pre-rendered HTML loads instantly
 - **SEO Friendly**: Search engines can crawl static content
 - **CDN Ready**: Static files can be cached globally
 - **Zero Server**: No Node.js server required in production

## 2. Basic Static Generation

Basic static generation involves creating a build process that pre-renders all pages to static HTML files. This approach provides the foundation for more advanced static site generation scenarios.

### 2.1. Project Structure

The following section outlines the recommended project structure for static site generation, organizing pages, components, data, and build scripts for efficient development and generation workflows.

```
my-static-site/
├── pages/
│   ├── index.tsx
│   ├── about.tsx
│   └── blog/
│       ├── index.tsx
│       └── [slug].tsx
├── components/
│   └── Layout.tsx
├── data/
│   └── posts.json
└── scripts/
    └── generate.ts
```

### 2.2. Static Generation Script

The following example demonstrates the basic static generation script that builds all pages and generates static HTML files for deployment to any static hosting provider.

```typescript
// scripts/generate.ts
import { Builder } from 'reactus';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

const builder = new Builder({
  cwd: process.cwd(),
  buildDir: 'dist'
});

async function generateStaticSite() {
  // Build all pages
  await builder.build();
  
  // Define routes to generate
  const routes = [
    '/',
    '/about',
    '/blog',
    '/blog/getting-started',
    '/blog/advanced-features'
  ];
  
  // Generate static HTML for each route
  for (const route of routes) {
    const html = await builder.render(route);
    const filePath = join('dist', route === '/' ? 'index.html' : `${route}.html`);
    
    // Ensure directory exists
    mkdirSync(dirname(filePath), { recursive: true });
    
    // Write HTML file
    writeFileSync(filePath, html);
    console.log(`Generated: ${filePath}`);
  }
}

generateStaticSite().catch(console.error);
```

### 2.3. Dynamic Route Generation

The following example shows how to generate static pages for dynamic routes based on data sources, enabling content-driven static site generation for blogs, documentation, and other dynamic content.

```typescript
// scripts/generate-blog.ts
import { Builder } from 'reactus';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

interface BlogPost {
  slug: string;
  title: string;
  content: string;
  date: string;
}

async function generateBlogPages() {
  const builder = new Builder({
    cwd: process.cwd(),
    buildDir: 'dist'
  });
  
  await builder.build();
  
  // Load blog posts data
  const posts: BlogPost[] = JSON.parse(
    readFileSync('data/posts.json', 'utf-8')
  );
  
  // Generate individual blog post pages
  for (const post of posts) {
    const html = await builder.render(`/blog/${post.slug}`, {
      props: { post }
    });
    
    const filePath = join('dist', 'blog', `${post.slug}.html`);
    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, html);
    
    console.log(`Generated blog post: ${post.slug}`);
  }
  
  // Generate blog index with all posts
  const indexHtml = await builder.render('/blog', {
    props: { posts }
  });
  
  writeFileSync(join('dist', 'blog', 'index.html'), indexHtml);
}

generateBlogPages().catch(console.error);
```

## 3. Advanced Static Generation

Advanced static generation includes automated sitemap generation, RSS feeds, and sophisticated content processing. These features enhance SEO and provide comprehensive static site functionality.

### 3.1. Site Map Generation

The following example demonstrates automated sitemap generation for improved SEO and search engine discoverability of static site content.

```typescript
// scripts/generate-sitemap.ts
import { Builder } from 'reactus';
import { writeFileSync } from 'fs';
import { join } from 'path';

interface SiteMapEntry {
  url: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

async function generateSitemap() {
  const baseUrl = 'https://example.com';
  const entries: SiteMapEntry[] = [
    { url: '/', changefreq: 'daily', priority: 1.0 },
    { url: '/about', changefreq: 'monthly', priority: 0.8 },
    { url: '/blog', changefreq: 'daily', priority: 0.9 }
  ];
  
  // Add dynamic blog posts
  const posts: BlogPost[] = JSON.parse(
    readFileSync('data/posts.json', 'utf-8')
  );
  
  for (const post of posts) {
    entries.push({
      url: `/blog/${post.slug}`,
      lastmod: post.date,
      changefreq: 'weekly',
      priority: 0.7
    });
  }
  
  // Generate XML sitemap
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(entry => `  <url>
    <loc>${baseUrl}${entry.url}</loc>
    ${entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : ''}
    ${entry.changefreq ? `<changefreq>${entry.changefreq}</changefreq>` : ''}
    ${entry.priority ? `<priority>${entry.priority}</priority>` : ''}
  </url>`).join('\n')}
</urlset>`;
  
  writeFileSync(join('dist', 'sitemap.xml'), sitemap);
  console.log('Generated sitemap.xml');
}

generateSitemap().catch(console.error);
```

### 3.2. RSS Feed Generation

The following example shows how to generate RSS feeds for blog content and other dynamic content types, enabling content syndication and improved content distribution.

```typescript
// scripts/generate-rss.ts
import { writeFileSync } from 'fs';
import { join } from 'path';

async function generateRSSFeed() {
  const posts: BlogPost[] = JSON.parse(
    readFileSync('data/posts.json', 'utf-8')
  );
  
  const baseUrl = 'https://example.com';
  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>My Blog</title>
    <description>A blog about web development</description>
    <link>${baseUrl}</link>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${posts.map(post => `
    <item>
      <title>${post.title}</title>
      <description>${post.content.substring(0, 200)}...</description>
      <link>${baseUrl}/blog/${post.slug}</link>
      <guid>${baseUrl}/blog/${post.slug}</guid>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
    </item>`).join('')}
  </channel>
</rss>`;
  
  writeFileSync(join('dist', 'rss.xml'), rss);
  console.log('Generated RSS feed');
}

generateRSSFeed().catch(console.error);
```

## 4. Data-Driven Generation

Data-driven generation enables content management through markdown files, external APIs, and content management systems. This approach provides flexible content authoring while maintaining static site benefits.

### 4.1. Content Management

The following example demonstrates comprehensive content management using markdown files with frontmatter, enabling flexible content authoring and automated page generation.

```typescript
// scripts/content-generator.ts
import { Builder } from 'reactus';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname, basename } from 'path';
import matter from 'gray-matter';

interface ContentFile {
  slug: string;
  data: any;
  content: string;
  path: string;
}

class ContentGenerator {
  private builder: Builder;
  
  constructor() {
    this.builder = new Builder({
      cwd: process.cwd(),
      buildDir: 'dist'
    });
  }
  
  async loadMarkdownFiles(contentDir: string): Promise<ContentFile[]> {
    const files: ContentFile[] = [];
    
    const scanDirectory = (dir: string, prefix = '') => {
      const items = readdirSync(dir);
      
      for (const item of items) {
        const fullPath = join(dir, item);
        const stat = statSync(fullPath);
        
        if (stat.isDirectory()) {
          scanDirectory(fullPath, `${prefix}${item}/`);
        } else if (extname(item) === '.md') {
          const content = readFileSync(fullPath, 'utf-8');
          const { data, content: body } = matter(content);
          
          files.push({
            slug: `${prefix}${basename(item, '.md')}`,
            data,
            content: body,
            path: fullPath
          });
        }
      }
    };
    
    scanDirectory(contentDir);
    return files;
  }
  
  async generateFromMarkdown() {
    await this.builder.build();
    
    const posts = await this.loadMarkdownFiles('content/posts');
    const pages = await this.loadMarkdownFiles('content/pages');
    
    // Generate blog posts
    for (const post of posts) {
      const html = await this.builder.render('/blog/[slug]', {
        props: {
          post: {
            ...post.data,
            content: post.content,
            slug: post.slug
          }
        }
      });
      
      const filePath = join('dist', 'blog', `${post.slug}.html`);
      mkdirSync(dirname(filePath), { recursive: true });
      writeFileSync(filePath, html);
    }
    
    // Generate static pages
    for (const page of pages) {
      const html = await this.builder.render('/[page]', {
        props: {
          page: {
            ...page.data,
            content: page.content
          }
        }
      });
      
      const filePath = join('dist', `${page.slug}.html`);
      writeFileSync(filePath, html);
    }
  }
}

const generator = new ContentGenerator();
generator.generateFromMarkdown().catch(console.error);
```

## 5. Build Optimization

Build optimization focuses on asset processing, HTML minification, and performance enhancements for static sites. These optimizations ensure optimal loading performance and user experience.

### 5.1. Asset Optimization

The following example shows comprehensive asset optimization including HTML minification, image processing, and performance enhancements for static site deployment.

```typescript
// scripts/optimize-build.ts
import { Builder } from 'reactus';
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { minify } from 'html-minifier-terser';

class BuildOptimizer {
  private builder: Builder;
  
  constructor() {
    this.builder = new Builder({
      cwd: process.cwd(),
      buildDir: 'dist',
      minify: true
    });
  }
  
  async optimizeHTML() {
    const distDir = 'dist';
    
    const processDirectory = (dir: string) => {
      const items = readdirSync(dir);
      
      for (const item of items) {
        const fullPath = join(dir, item);
        const stat = statSync(fullPath);
        
        if (stat.isDirectory()) {
          processDirectory(fullPath);
        } else if (extname(item) === '.html') {
          const html = readFileSync(fullPath, 'utf-8');
          
          const minified = minify(html, {
            removeComments: true,
            removeRedundantAttributes: true,
            removeScriptTypeAttributes: true,
            removeStyleLinkTypeAttributes: true,
            sortClassName: true,
            useShortDoctype: true,
            collapseWhitespace: true,
            conservativeCollapse: true,
            minifyCSS: true,
            minifyJS: true
          });
          
          writeFileSync(fullPath, minified);
          console.log(`Optimized: ${fullPath}`);
        }
      }
    };
    
    processDirectory(distDir);
  }
  
  async generatePreloadHeaders() {
    // Generate _headers file for Netlify
    const headers = `/*
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin

/*.css
  Cache-Control: public, max-age=31536000, immutable

/*.js
  Cache-Control: public, max-age=31536000, immutable

/*.html
  Cache-Control: public, max-age=0, must-revalidate`;
    
    writeFileSync(join('dist', '_headers'), headers);
    console.log('Generated _headers file');
  }
}

const optimizer = new BuildOptimizer();
optimizer.optimizeHTML()
  .then(() => optimizer.generatePreloadHeaders())
  .catch(console.error);
```

## 6. Deployment Examples

Deployment examples cover various static hosting platforms and their specific configuration requirements. These examples provide ready-to-use configurations for popular hosting services.

### 6.1. Netlify Deployment

The following example demonstrates Netlify deployment configuration with build settings, redirects, and performance optimizations for static site hosting.

```typescript
// netlify.toml
[build]
  command = "npm run generate"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 404

[build.environment]
  NODE_VERSION = "18"
```

### 6.2. Vercel Deployment

The following example shows Vercel deployment configuration with static build optimization and routing configuration for serverless static hosting.

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "handle": "filesystem"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

### 6.3. GitHub Pages Deployment

The following example demonstrates GitHub Pages deployment using GitHub Actions for automated static site building and deployment workflows.

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Generate static site
      run: npm run generate
    
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist
```

## 7. Package.json Scripts

The following provides convenient npm scripts for various static generation scenarios, enabling easy execution of build processes and deployment workflows.

```json
{
  "scripts": {
    "generate": "tsx scripts/generate.ts",
    "generate:blog": "tsx scripts/generate-blog.ts",
    "generate:sitemap": "tsx scripts/generate-sitemap.ts",
    "generate:rss": "tsx scripts/generate-rss.ts",
    "generate:all": "npm run generate && npm run generate:blog && npm run generate:sitemap && npm run generate:rss",
    "optimize": "tsx scripts/optimize-build.ts",
    "build:static": "npm run generate:all && npm run optimize",
    "preview": "serve dist",
    "deploy": "npm run build:static && netlify deploy --prod --dir=dist"
  }
}
```

## 8. Best Practices

Static site generation best practices ensure optimal performance, SEO, and maintainability. Following these guidelines helps create efficient static sites that scale with content and complexity.

### 8.1. Performance Optimization

Performance optimization techniques focus on loading speed, resource efficiency, and user experience for static sites.

 - **Code Splitting**: Use dynamic imports for large components
 - **Image Optimization**: Compress and resize images during build
 - **Critical CSS**: Inline critical CSS for above-the-fold content
 - **Preload Resources**: Generate preload hints for important assets

### 8.2. SEO Optimization

SEO optimization ensures maximum search engine visibility and social media compatibility for static sites.

 - **Meta Tags**: Generate appropriate meta tags for each page
 - **Structured Data**: Include JSON-LD structured data
 - **Open Graph**: Add Open Graph tags for social sharing
 - **Canonical URLs**: Set canonical URLs to avoid duplicate content

### 8.3. Content Management

Content management best practices enable efficient content authoring and maintenance workflows for static sites.

 - **Markdown Support**: Use markdown for content authoring
 - **Asset Pipeline**: Optimize images and other assets
 - **Content Validation**: Validate content structure and links
 - **Incremental Builds**: Only rebuild changed content

This approach provides a complete static site generation solution with Reactus, offering the benefits of React components while generating fast, SEO-friendly static HTML files.
