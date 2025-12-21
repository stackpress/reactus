# Custom Build Configuration with Reactus

This guide demonstrates how to customize the build process in Reactus, including custom Vite configurations, build plugins, asset processing, and advanced optimization techniques. Reactus provides extensive flexibility for tailoring the build process to meet specific project requirements while maintaining optimal performance and developer experience.

 1. [Overview](#1-overview)
 2. [Basic Build Customization](#2-basic-build-customization)
 3. [Custom Build Plugins](#3-custom-build-plugins)
 4. [Advanced Build Configurations](#4-advanced-build-configurations)
 5. [Build Hooks and Lifecycle](#5-build-hooks-and-lifecycle)
 6. [Build Optimization Techniques](#6-build-optimization-techniques)
 7. [Package.json Scripts](#7-packagejson-scripts)
 8. [Best Practices](#8-best-practices)

## 1. Overview

Reactus provides flexible build customization through comprehensive integration with Vite and custom build systems. This flexibility enables developers to create optimized builds tailored to their specific deployment requirements and performance goals.

**Build Customization Features**

 - **Vite Configuration**: Custom Vite plugins and settings
 - **Build Hooks**: Pre and post-build processing
 - **Asset Pipeline**: Custom asset processing and optimization
 - **Plugin System**: Extensible plugin architecture

## 2. Basic Build Customization

Basic build customization involves configuring Vite settings and environment-specific builds. These fundamental customizations provide the foundation for more advanced build optimizations and deployment strategies.

### 2.1. Custom Vite Configuration

This example demonstrates how to create a custom Vite configuration with specific build optimizations, manual chunk splitting, and environment variables. The configuration includes terser minification, source maps, and custom build-time constants.

```typescript
// scripts/custom-build.ts
import { Builder } from 'reactus';
import { defineConfig } from 'vite';
import { resolve } from 'path';

const customViteConfig = defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, '../pages/index.tsx'),
        admin: resolve(__dirname, '../pages/admin.tsx')
      },
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['lodash', 'date-fns']
        }
      }
    },
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __VERSION__: JSON.stringify(process.env.npm_package_version)
  }
});

const builder = new Builder({
  cwd: process.cwd(),
  buildDir: 'dist',
  vite: customViteConfig
});

async function customBuild() {
  await builder.build();
  console.log('Custom build completed');
}

customBuild().catch(console.error);
```

This example shows how to create a custom Vite configuration for Reactus builds. Custom configurations allow you to tailor the build process with specific optimizations, plugins, and output settings.

### 2.2. Environment-Specific Builds

This example shows how to configure different build settings for development, staging, and production environments. Each environment has tailored optimizations, API endpoints, and feature flags to ensure optimal performance for each deployment target.

```typescript
// scripts/build-environments.ts
import { Builder } from 'reactus';
import { defineConfig } from 'vite';

interface BuildEnvironment {
  name: string;
  config: any;
  outputDir: string;
}

const environments: BuildEnvironment[] = [
  {
    name: 'development',
    outputDir: 'dist/dev',
    config: defineConfig({
      mode: 'development',
      build: {
        sourcemap: true,
        minify: false
      },
      define: {
        __DEV__: true,
        __API_URL__: JSON.stringify('http://localhost:3001')
      }
    })
  },
  {
    name: 'staging',
    outputDir: 'dist/staging',
    config: defineConfig({
      mode: 'production',
      build: {
        sourcemap: true,
        minify: 'esbuild'
      },
      define: {
        __DEV__: false,
        __API_URL__: JSON.stringify('https://staging-api.example.com')
      }
    })
  },
  {
    name: 'production',
    outputDir: 'dist/prod',
    config: defineConfig({
      mode: 'production',
      build: {
        sourcemap: false,
        minify: 'terser',
        rollupOptions: {
          output: {
            manualChunks: {
              vendor: ['react', 'react-dom'],
              utils: ['lodash']
            }
          }
        }
      },
      define: {
        __DEV__: false,
        __API_URL__: JSON.stringify('https://api.example.com')
      }
    })
  }
];

async function buildAllEnvironments() {
  for (const env of environments) {
    console.log(`Building ${env.name} environment...`);
    
    const builder = new Builder({
      cwd: process.cwd(),
      buildDir: env.outputDir,
      vite: env.config
    });
    
    await builder.build();
    console.log(`✓ ${env.name} build completed`);
  }
}

buildAllEnvironments().catch(console.error);
```

This example demonstrates how to configure different build settings for various environments. Environment-specific builds ensure optimal configurations for development, staging, and production deployments.

## 3. Custom Build Plugins

Custom build plugins extend the build process with additional functionality and optimizations. These plugins can handle asset processing, bundle analysis, and custom transformations to enhance the build pipeline.

### 3.1. Asset Processing Plugin

This plugin demonstrates comprehensive asset processing capabilities including image optimization, WebP generation, and critical CSS inlining. The plugin integrates with the Vite build process to automatically optimize assets during compilation.

```typescript
// plugins/asset-processor.ts
import { Plugin } from 'vite';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import sharp from 'sharp';

interface AssetProcessorOptions {
  imageOptimization?: boolean;
  generateWebP?: boolean;
  inlineCriticalCSS?: boolean;
}

export function assetProcessor(options: AssetProcessorOptions = {}): Plugin {
  return {
    name: 'asset-processor',
    
    async generateBundle(outputOptions, bundle) {
      if (options.imageOptimization) {
        await this.optimizeImages(bundle);
      }
      
      if (options.generateWebP) {
        await this.generateWebPImages(bundle);
      }
    },
    
    async writeBundle(outputOptions, bundle) {
      if (options.inlineCriticalCSS) {
        await this.inlineCriticalCSS(outputOptions.dir);
      }
    },
    
    async optimizeImages(bundle: any) {
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (fileName.match(/\.(jpg|jpeg|png)$/)) {
          const optimized = await sharp(chunk.source)
            .jpeg({ quality: 80 })
            .png({ compressionLevel: 9 })
            .toBuffer();
          
          chunk.source = optimized;
        }
      }
    },
    
    async generateWebPImages(bundle: any) {
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (fileName.match(/\.(jpg|jpeg|png)$/)) {
          const webpBuffer = await sharp(chunk.source)
            .webp({ quality: 80 })
            .toBuffer();
          
          const webpFileName = fileName.replace(/\.(jpg|jpeg|png)$/, '.webp');
          bundle[webpFileName] = {
            type: 'asset',
            source: webpBuffer,
            fileName: webpFileName
          };
        }
      }
    },
    
    async inlineCriticalCSS(outputDir: string) {
      // Implementation for inlining critical CSS
      console.log('Inlining critical CSS...');
    }
  };
}
```

This plugin demonstrates how to create custom asset processing functionality. The asset processor can optimize images, generate WebP versions, and inline critical CSS for improved performance.

### 3.2. Bundle Analyzer Plugin

This plugin provides detailed bundle analysis and reporting functionality. It generates both JSON and HTML reports showing bundle sizes, chunk distribution, and module composition to help identify optimization opportunities.

```typescript
// plugins/bundle-analyzer.ts
import { Plugin } from 'vite';
import { writeFileSync } from 'fs';
import { join } from 'path';

interface BundleStats {
  totalSize: number;
  chunks: Array<{
    name: string;
    size: number;
    modules: string[];
  }>;
  assets: Array<{
    name: string;
    size: number;
    type: string;
  }>;
}

export function bundleAnalyzer(): Plugin {
  return {
    name: 'bundle-analyzer',
    
    generateBundle(outputOptions, bundle) {
      const stats: BundleStats = {
        totalSize: 0,
        chunks: [],
        assets: []
      };
      
      for (const [fileName, chunk] of Object.entries(bundle)) {
        const size = chunk.type === 'chunk' 
          ? Buffer.byteLength(chunk.code, 'utf8')
          : chunk.source.length;
        
        stats.totalSize += size;
        
        if (chunk.type === 'chunk') {
          stats.chunks.push({
            name: fileName,
            size,
            modules: Object.keys(chunk.modules || {})
          });
        } else {
          stats.assets.push({
            name: fileName,
            size,
            type: chunk.type
          });
        }
      }
      
      // Generate bundle report
      const reportPath = join(outputOptions.dir || 'dist', 'bundle-report.json');
      writeFileSync(reportPath, JSON.stringify(stats, null, 2));
      
      // Generate HTML report
      const htmlReport = this.generateHTMLReport(stats);
      const htmlPath = join(outputOptions.dir || 'dist', 'bundle-report.html');
      writeFileSync(htmlPath, htmlReport);
      
      console.log(`Bundle analysis saved to ${reportPath}`);
    },
    
    generateHTMLReport(stats: BundleStats): string {
      return `
<!DOCTYPE html>
<html>
<head>
  <title>Bundle Analysis Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .chunk { margin: 10px 0; padding: 10px; border: 1px solid #ddd; }
    .size { font-weight: bold; color: #666; }
  </style>
</head>
<body>
  <h1>Bundle Analysis Report</h1>
  <p>Total Size: <span class="size">${(stats.totalSize / 1024).toFixed(2)} KB</span></p>
  
  <h2>Chunks</h2>
  ${stats.chunks.map(chunk => `
    <div class="chunk">
      <h3>${chunk.name}</h3>
      <p class="size">${(chunk.size / 1024).toFixed(2)} KB</p>
      <p>Modules: ${chunk.modules.length}</p>
    </div>
  `).join('')}
  
  <h2>Assets</h2>
  ${stats.assets.map(asset => `
    <div class="chunk">
      <h3>${asset.name}</h3>
      <p class="size">${(asset.size / 1024).toFixed(2)} KB</p>
      <p>Type: ${asset.type}</p>
    </div>
  `).join('')}
</body>
</html>`;
    }
  };
}
```

This plugin provides bundle analysis capabilities to monitor and optimize build output. The analyzer generates detailed reports about bundle sizes, chunk distribution, and optimization opportunities.

## 4. Advanced Build Configurations

Advanced build configurations enable sophisticated build scenarios including multi-target builds, progressive web apps, and specialized deployment requirements. These configurations provide maximum flexibility for complex projects.

### 4.1. Multi-Target Builds

This example demonstrates how to build for multiple target formats including ES modules, CommonJS, and UMD. Each target has specific configurations for browser compatibility, module systems, and external dependencies.

```typescript
// scripts/multi-target-build.ts
import { Builder } from 'reactus';
import { defineConfig } from 'vite';

interface BuildTarget {
  name: string;
  format: 'es' | 'cjs' | 'umd';
  outputDir: string;
  config: any;
}

const targets: BuildTarget[] = [
  {
    name: 'modern',
    format: 'es',
    outputDir: 'dist/modern',
    config: defineConfig({
      build: {
        target: 'es2020',
        lib: {
          entry: 'src/index.ts',
          formats: ['es']
        }
      }
    })
  },
  {
    name: 'legacy',
    format: 'cjs',
    outputDir: 'dist/legacy',
    config: defineConfig({
      build: {
        target: 'es5',
        lib: {
          entry: 'src/index.ts',
          formats: ['cjs']
        }
      }
    })
  },
  {
    name: 'umd',
    format: 'umd',
    outputDir: 'dist/umd',
    config: defineConfig({
      build: {
        lib: {
          entry: 'src/index.ts',
          formats: ['umd'],
          name: 'ReactusApp'
        },
        rollupOptions: {
          external: ['react', 'react-dom'],
          output: {
            globals: {
              react: 'React',
              'react-dom': 'ReactDOM'
            }
          }
        }
      }
    })
  }
];

async function buildMultipleTargets() {
  for (const target of targets) {
    console.log(`Building ${target.name} target...`);
    
    const builder = new Builder({
      cwd: process.cwd(),
      buildDir: target.outputDir,
      vite: target.config
    });
    
    await builder.build();
    console.log(`✓ ${target.name} build completed`);
  }
}

buildMultipleTargets().catch(console.error);
```

This example shows how to configure builds for multiple target environments and formats. Multi-target builds enable support for different module systems and browser compatibility requirements.

### 4.2. Progressive Web App Build

This example shows how to configure a Progressive Web App build with service worker generation, manifest creation, and offline caching strategies. The PWA build enables app-like experiences with offline functionality.

```typescript
// scripts/pwa-build.ts
import { Builder } from 'reactus';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const pwaConfig = defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.example\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      manifest: {
        name: 'Reactus App',
        short_name: 'ReactusApp',
        description: 'A Reactus Progressive Web App',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
});

const builder = new Builder({
  cwd: process.cwd(),
  buildDir: 'dist',
  vite: pwaConfig
});

async function buildPWA() {
  await builder.build();
  console.log('PWA build completed');
}

buildPWA().catch(console.error);
```

This example demonstrates how to configure a Progressive Web App build with service workers and manifest generation. PWA builds enable offline functionality and app-like experiences.

## 5. Build Hooks and Lifecycle

Build hooks and lifecycle management provide control over the entire build process from start to finish. Custom pipelines enable pre-build validation, post-build optimization, and deployment automation.

```typescript
// scripts/build-pipeline.ts
import { Builder } from 'reactus';
import { execSync } from 'child_process';
import { copyFileSync, mkdirSync } from 'fs';
import { join } from 'path';

class CustomBuildPipeline {
  private builder: Builder;
  
  constructor() {
    this.builder = new Builder({
      cwd: process.cwd(),
      buildDir: 'dist'
    });
  }
  
  async runPipeline() {
    console.log('Starting custom build pipeline...');
    
    try {
      await this.preBuild();
      await this.build();
      await this.postBuild();
      
      console.log('✓ Build pipeline completed successfully');
    } catch (error) {
      console.error('✗ Build pipeline failed:', error);
      throw error;
    }
  }
  
  async preBuild() {
    console.log('Running pre-build tasks...');
    
    // Clean previous build
    execSync('rm -rf dist', { stdio: 'inherit' });
    
    // Generate build metadata
    const buildInfo = {
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version,
      commit: execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim(),
      branch: execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim()
    };
    
    mkdirSync('dist', { recursive: true });
    writeFileSync(
      join('dist', 'build-info.json'),
      JSON.stringify(buildInfo, null, 2)
    );
    
    // Run tests
    execSync('npm test', { stdio: 'inherit' });
    
    // Lint code
    execSync('npm run lint', { stdio: 'inherit' });
  }
  
  async build() {
    console.log('Running main build...');
    await this.builder.build();
  }
  
  async postBuild() {
    console.log('Running post-build tasks...');
    
    // Copy additional assets
    copyFileSync('robots.txt', join('dist', 'robots.txt'));
    copyFileSync('sitemap.xml', join('dist', 'sitemap.xml'));
    
    // Generate build report
    await this.generateBuildReport();
    
    // Compress assets
    execSync('gzip -k dist/**/*.{js,css,html}', { stdio: 'inherit' });
    
    // Upload to CDN (if configured)
    if (process.env.CDN_UPLOAD === 'true') {
      await this.uploadToCDN();
    }
  }
  
  async generateBuildReport() {
    const { execSync } = require('child_process');
    
    // Generate bundle size report
    execSync('npx bundlesize', { stdio: 'inherit' });
    
    // Generate lighthouse CI report
    if (process.env.LIGHTHOUSE_CI === 'true') {
      execSync('npx lhci autorun', { stdio: 'inherit' });
    }
  }
  
  async uploadToCDN() {
    console.log('Uploading assets to CDN...');
    // Implementation depends on your CDN provider
    // Example: AWS S3, Cloudflare, etc.
  }
}

const pipeline = new CustomBuildPipeline();
pipeline.runPipeline().catch(console.error);
```

This example shows how to create a comprehensive build pipeline with custom hooks and lifecycle management. The pipeline includes validation, building, optimization, and deployment steps.

## 6. Build Optimization Techniques

Build optimization techniques focus on improving performance, reducing bundle sizes, and enhancing loading speeds. These strategies ensure optimal application performance across different deployment scenarios.

### 6.1. Code Splitting Strategy

This example demonstrates advanced code splitting strategies using manual chunk configuration. The strategy separates vendor libraries, UI frameworks, and feature-based code into optimized chunks for better loading performance.

```typescript
// scripts/optimized-build.ts
import { Builder } from 'reactus';
import { defineConfig } from 'vite';

const optimizedConfig = defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunk for node_modules
          if (id.includes('node_modules')) {
            // Separate React into its own chunk
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            
            // UI libraries
            if (id.includes('@mui') || id.includes('antd') || id.includes('chakra-ui')) {
              return 'ui-vendor';
            }
            
            // Utility libraries
            if (id.includes('lodash') || id.includes('date-fns') || id.includes('ramda')) {
              return 'utils-vendor';
            }
            
            // Other vendor code
            return 'vendor';
          }
          
          // Feature-based chunks
          if (id.includes('/features/auth/')) {
            return 'auth';
          }
          
          if (id.includes('/features/dashboard/')) {
            return 'dashboard';
          }
          
          if (id.includes('/features/admin/')) {
            return 'admin';
          }
        }
      }
    }
  }
});

const builder = new Builder({
  cwd: process.cwd(),
  buildDir: 'dist',
  vite: optimizedConfig
});

async function optimizedBuild() {
  await builder.build();
  console.log('Optimized build completed');
}

optimizedBuild().catch(console.error);
```

This example demonstrates advanced code splitting strategies for optimal bundle organization. Strategic code splitting improves loading performance by creating logical chunks based on features and dependencies.

### 6.2. Performance Monitoring

This example shows how to implement comprehensive performance monitoring for build processes. The monitoring system tracks build phases, measures execution times, and generates detailed performance reports for optimization analysis.

```typescript
// scripts/performance-build.ts
import { Builder } from 'reactus';
import { performance } from 'perf_hooks';
import { writeFileSync } from 'fs';
import { join } from 'path';

class PerformanceBuild {
  private metrics: Array<{ name: string; duration: number }> = [];
  
  async build() {
    const startTime = performance.now();
    
    const builder = new Builder({
      cwd: process.cwd(),
      buildDir: 'dist'
    });
    
    // Measure build phases
    await this.measurePhase('Pre-build', async () => {
      // Pre-build tasks
    });
    
    await this.measurePhase('Main build', async () => {
      await builder.build();
    });
    
    await this.measurePhase('Post-build', async () => {
      // Post-build tasks
    });
    
    const totalTime = performance.now() - startTime;
    this.metrics.push({ name: 'Total build time', duration: totalTime });
    
    // Save performance report
    this.savePerformanceReport();
  }
  
  async measurePhase(name: string, fn: () => Promise<void>) {
    const start = performance.now();
    await fn();
    const duration = performance.now() - start;
    this.metrics.push({ name, duration });
    console.log(`${name}: ${duration.toFixed(2)}ms`);
  }
  
  savePerformanceReport() {
    const report = {
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      summary: {
        totalTime: this.metrics.find(m => m.name === 'Total build time')?.duration,
        slowestPhase: this.metrics.reduce((prev, current) => 
          prev.duration > current.duration ? prev : current
        )
      }
    };
    
    writeFileSync(
      join('dist', 'performance-report.json'),
      JSON.stringify(report, null, 2)
    );
    
    console.log('Performance report saved to dist/performance-report.json');
  }
}

const perfBuild = new PerformanceBuild();
perfBuild.build().catch(console.error);
```

This example shows how to implement performance monitoring for build processes. Performance monitoring provides insights into build times, optimization opportunities, and bottleneck identification.

## 7. Package.json Scripts

This section provides a comprehensive set of npm scripts for various build scenarios and configurations. These scripts enable easy execution of custom builds, environment-specific builds, and specialized build processes from the command line.

```json
{
  "scripts": {
    "build": "tsx scripts/custom-build.ts",
    "build:dev": "tsx scripts/build-environments.ts development",
    "build:staging": "tsx scripts/build-environments.ts staging",
    "build:prod": "tsx scripts/build-environments.ts production",
    "build:all": "tsx scripts/build-environments.ts",
    "build:multi": "tsx scripts/multi-target-build.ts",
    "build:pwa": "tsx scripts/pwa-build.ts",
    "build:optimized": "tsx scripts/optimized-build.ts",
    "build:perf": "tsx scripts/performance-build.ts",
    "pipeline": "tsx scripts/build-pipeline.ts",
    "analyze": "npm run build && npx vite-bundle-analyzer dist",
    "size-check": "npm run build && npx bundlesize"
  }
}
```

This section provides convenient npm scripts for various build configurations and scenarios. These scripts simplify the execution of complex build processes and enable easy integration with CI/CD pipelines.

## 8. Best Practices

Build best practices ensure optimal performance, maintainability, and developer experience. Following these guidelines helps create efficient build processes that scale with project complexity and team size.

### 8.1. Build Performance

Optimizing build performance is crucial for maintaining efficient development workflows and fast deployment cycles. These practices help reduce build times and improve overall developer experience.

 - **Parallel Processing**: Use worker threads for CPU-intensive tasks
 - **Incremental Builds**: Only rebuild changed files
 - **Caching**: Implement build caching for dependencies
 - **Tree Shaking**: Ensure dead code elimination

### 8.2. Asset Optimization

Proper asset optimization ensures optimal loading performance and user experience. These techniques help minimize bundle sizes and improve application performance.

 - **Image Optimization**: Compress and convert images to modern formats
 - **Code Splitting**: Split code into logical chunks
 - **Lazy Loading**: Implement dynamic imports for routes
 - **Bundle Analysis**: Regular bundle size monitoring

### 8.3. Development Experience

Maintaining a smooth development experience is essential for productivity. These practices ensure fast feedback loops and efficient debugging capabilities.

 - **Fast Rebuilds**: Optimize development build speed
 - **Source Maps**: Provide accurate debugging information
 - **Hot Reload**: Maintain state during development
 - **Error Reporting**: Clear build error messages

This comprehensive guide provides the foundation for customizing Reactus builds to meet specific project requirements while maintaining optimal performance and developer experience.
