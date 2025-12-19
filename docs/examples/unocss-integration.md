# UnoCSS Integration with Reactus

This comprehensive guide demonstrates how to integrate UnoCSS with Reactus for instant on-demand atomic CSS generation. UnoCSS provides a fast, flexible, and highly customizable CSS framework that generates styles on-demand based on your usage.

## Table of Contents

- [Quick Start](#quick-start)
- [Installation](#installation)
- [Configuration](#configuration)
- [Development Setup](#development-setup)
- [Component Examples](#component-examples)
- [Advanced Features](#advanced-features)
- [Production Build](#production-build)
- [Troubleshooting](#troubleshooting)

## Quick Start

Get started with UnoCSS and Reactus in minutes:

```bash
# Create a new project
mkdir my-reactus-app && cd my-reactus-app
npm init -y

# Install dependencies
npm install react react-dom reactus
npm install -D unocss @types/react @types/react-dom typescript ts-node vite

# Create UnoCSS config
echo 'import { defineConfig, presetUno, presetAttributify } from "unocss"

export default defineConfig({
  presets: [presetUno(), presetAttributify()]
})' > uno.config.ts
```

## Installation

### 1. Install UnoCSS and Dependencies

```bash
npm install -D unocss
```

### 2. Optional Presets and Plugins

```bash
# Popular presets
npm install -D @unocss/preset-uno @unocss/preset-attributify @unocss/preset-icons

# Icon collections (optional)
npm install -D @iconify-json/carbon @iconify-json/heroicons
```

## Configuration

### Basic Configuration

Create a `uno.config.ts` file in your project root:

```typescript
// uno.config.ts
import { defineConfig, presetUno, presetAttributify } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(), // Essential utilities
    presetAttributify() // Attributify mode support
  ]
})
```

### Advanced Configuration

```typescript
// uno.config.ts
import { 
  defineConfig, 
  presetUno, 
  presetAttributify, 
  presetIcons,
  presetWebFonts,
  transformerDirectives,
  transformerVariantGroup
} from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({
      collections: {
        carbon: () => import('@iconify-json/carbon/icons.json').then(i => i.default),
        heroicons: () => import('@iconify-json/heroicons/icons.json').then(i => i.default),
      }
    }),
    presetWebFonts({
      fonts: {
        sans: 'Inter:400,500,600,700',
        mono: 'Fira Code:400,500'
      }
    })
  ],
  transformers: [
    transformerDirectives(), // Enable @apply, @screen directives
    transformerVariantGroup() // Enable variant group syntax
  ],
  theme: {
    colors: {
      primary: {
        50: '#eff6ff',
        100: '#dbeafe',
        200: '#bfdbfe',
        300: '#93c5fd',
        400: '#60a5fa',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8',
        800: '#1e40af',
        900: '#1e3a8a',
      },
      gray: {
        50: '#f9fafb',
        100: '#f3f4f6',
        200: '#e5e7eb',
        300: '#d1d5db',
        400: '#9ca3af',
        500: '#6b7280',
        600: '#4b5563',
        700: '#374151',
        800: '#1f2937',
        900: '#111827',
      }
    },
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['Fira Code', 'monospace']
    },
    spacing: {
      '18': '4.5rem',
      '88': '22rem'
    }
  },
  shortcuts: {
    // Custom component shortcuts
    'btn': 'px-4 py-2 rounded-lg font-medium transition-all duration-200 cursor-pointer border-none',
    'btn-primary': 'btn bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700',
    'btn-secondary': 'btn bg-gray-200 text-gray-900 hover:bg-gray-300 active:bg-gray-400',
    'btn-outline': 'btn border-2 border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white',
    'btn-lg': 'px-6 py-3 text-lg',
    'btn-sm': 'px-3 py-1.5 text-sm',
    
    // Layout shortcuts
    'container': 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
    'section': 'py-16 lg:py-24',
    'card': 'bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300',
    
    // Typography shortcuts
    'heading-1': 'text-4xl lg:text-6xl font-bold text-gray-900 leading-tight',
    'heading-2': 'text-3xl lg:text-4xl font-bold text-gray-900 leading-tight',
    'heading-3': 'text-2xl lg:text-3xl font-semibold text-gray-900',
    'body-large': 'text-lg lg:text-xl text-gray-600 leading-relaxed',
    'body': 'text-base text-gray-600 leading-relaxed'
  },
  rules: [
    // Custom rules
    ['text-reactus', { color: '#61dafb' }],
    [/^slide-in-(\d+)$/, ([, d]) => ({ 
      animation: `slideIn ${d}00ms ease-out` 
    })],
  ],
  safelist: [
    // Always include these classes
    'text-reactus',
    'btn-primary',
    'btn-secondary'
  ]
})
```

## Development Setup

### Development Server Configuration

```typescript
// scripts/develop.ts
import { createServer } from 'node:http';
import UnoCSS from 'unocss/vite';
import { dev } from 'reactus';

async function develop() {
  const cwd = process.cwd();
  const engine = dev({
    cwd,
    basePath: '/',
    plugins: [UnoCSS()],
    watchIgnore: ['**/.build/**'],
    clientRoute: '/client',
    cssFiles: [
      'reactus/fouc.css', // FOUC prevention
      'virtual:uno.css'   // UnoCSS virtual file
    ]
  });

  const server = createServer(async (req, res) => {
    // Handle public assets and HMR
    await engine.http(req, res);
    if (res.headersSent) return;

    // Route handling
    if (req.url === '/') {
      res.setHeader('Content-Type', 'text/html');
      res.end(await engine.render('@/pages/home', { 
        title: 'UnoCSS + Reactus',
        description: 'Instant on-demand atomic CSS with UnoCSS and Reactus'
      }));
      return;
    }

    if (req.url === '/about') {
      res.setHeader('Content-Type', 'text/html');
      res.end(await engine.render('@/pages/about'));
      return;
    }

    if (req.url === '/components') {
      res.setHeader('Content-Type', 'text/html');
      res.end(await engine.render('@/pages/components'));
      return;
    }

    res.statusCode = 404;
    res.end('404 Not Found');
  });

  server.listen(3000, () => {
    console.log('🚀 Server running at http://localhost:3000/');
    console.log('⚡ UnoCSS ready for instant CSS generation');
  });
}

develop().catch(e => {
  console.error(e);
  process.exit(1);
});
```

### Package.json Scripts

```json
{
  "name": "reactus-with-unocss",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "ts-node scripts/develop.ts",
    "build": "ts-node scripts/build.ts",
    "start": "ts-node scripts/start.ts",
    "preview": "npm run build && npm run start"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "reactus": "^0.6.1"
  },
  "devDependencies": {
    "@types/node": "^22.9.3",
    "@types/react": "^19.0.10",
    "@types/react-dom": "^19.0.4",
    "@iconify-json/carbon": "^1.2.1",
    "@iconify-json/heroicons": "^1.2.0",
    "ts-node": "^10.9.2",
    "typescript": "^5.7.2",
    "unocss": "^0.66.0",
    "vite": "^6.1.1"
  }
}
```

## Component Examples

### Home Page with UnoCSS

```tsx
// pages/home.tsx
import { useState } from 'react';
import Button from '../components/Button';
import FeatureCard from '../components/FeatureCard';
import Hero from '../components/Hero';

export function Head({ title, description }: { 
  title: string; 
  description: string; 
}) {
  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="icon" type="image/svg+xml" href="/react.svg" />
    </>
  );
}

export default function HomePage({ 
  title, 
  description 
}: { 
  title: string; 
  description: string; 
}) {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <Hero title={title} description={description} />

      {/* Interactive Demo */}
      <section className="section">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="heading-2 mb-4">Interactive Demo</h2>
            <p className="body-large mb-8">
              Click the button to see UnoCSS classes in action
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                variant="primary"
                size="lg"
                onClick={() => setCount(count + 1)}
                className="slide-in-3"
              >
                Count is {count}
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                onClick={() => setCount(0)}
              >
                Reset
              </Button>
            </div>

            {count > 0 && (
              <div className="mt-6 p-4 bg-green-100 border border-green-300 rounded-lg inline-block">
                <p className="text-green-800 font-medium">
                  🎉 You've clicked {count} time{count !== 1 ? 's' : ''}!
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="section bg-white">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="heading-2 mb-4">Why UnoCSS + Reactus?</h2>
            <p className="body-large max-w-3xl mx-auto">
              Combine the power of instant CSS generation with server-side rendering
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon="i-carbon-flash"
              title="Instant Generation"
              description="CSS is generated on-demand as you write classes"
              color="text-yellow-500"
            />
            
            <FeatureCard
              icon="i-carbon-rocket"
              title="Zero Runtime"
              description="No JavaScript runtime, pure CSS output"
              color="text-blue-500"
            />
            
            <FeatureCard
              icon="i-carbon-settings"
              title="Highly Configurable"
              description="Customize everything with presets and rules"
              color="text-green-500"
            />
            
            <FeatureCard
              icon="i-carbon-tree-view-alt"
              title="Tree Shakable"
              description="Only used styles are included in the final bundle"
              color="text-purple-500"
            />
            
            <FeatureCard
              icon="i-carbon-code"
              title="Developer Experience"
              description="Great IDE support with autocomplete"
              color="text-red-500"
            />
            
            <FeatureCard
              icon="i-carbon-mobile"
              title="Responsive Design"
              description="Built-in responsive utilities and breakpoints"
              color="text-indigo-500"
            />
          </div>
        </div>
      </section>

      {/* Attributify Demo */}
      <section className="section bg-gray-50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="heading-2 mb-4">Attributify Mode</h2>
            <p className="body-large mb-8">
              Write utilities as attributes for better readability
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div 
              bg="white" 
              p="8" 
              rounded="xl" 
              shadow="lg"
              border="2 gray-200"
              className="mb-8"
            >
              <h3 text="2xl" font="semibold" text="gray-900" mb="4">
                Attributify Example
              </h3>
              <p text="gray-600" leading="relaxed" mb="6">
                Instead of long className strings, you can use individual attributes
                for each utility category.
              </p>
              
              <div flex="~ col sm:row" gap="4">
                <button
                  bg="primary-500 hover:primary-600"
                  text="white"
                  px="6"
                  py="3"
                  rounded="lg"
                  font="medium"
                  transition="all duration-200"
                  transform="hover:scale-105"
                  shadow="md hover:lg"
                >
                  Attributify Button
                </button>
                
                <button
                  border="2 primary-500"
                  text="primary-500 hover:white"
                  bg="transparent hover:primary-500"
                  px="6"
                  py="3"
                  rounded="lg"
                  font="medium"
                  transition="all duration-200"
                >
                  Outline Button
                </button>
              </div>
            </div>

            <div className="bg-gray-900 text-gray-100 p-6 rounded-lg font-mono text-sm overflow-x-auto">
              <pre>{`<button
  bg="primary-500 hover:primary-600"
  text="white"
  px="6"
  py="3"
  rounded="lg"
  font="medium"
  transition="all duration-200"
>
  Attributify Button
</button>`}</pre>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
```

### Reusable Button Component

```tsx
// components/Button.tsx
import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  className = '',
  type = 'button'
}: ButtonProps) {
  const baseClasses = 'btn inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'btn-outline',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100'
  };

  const sizeClasses = {
    sm: 'btn-sm',
    md: '',
    lg: 'btn-lg'
  };

  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading && (
        <div className="i-carbon-loading animate-spin" />
      )}
      {children}
    </button>
  );
}
```

### Feature Card Component

```tsx
// components/FeatureCard.tsx
interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  color?: string;
}

export default function FeatureCard({ 
  icon, 
  title, 
  description, 
  color = 'text-primary-500' 
}: FeatureCardProps) {
  return (
    <div className="card group">
      <div className={`${icon} text-4xl mb-4 ${color} group-hover:scale-110 transition-transform duration-300`} />
      <h3 className="heading-3 mb-3 text-xl">{title}</h3>
      <p className="body text-sm">{description}</p>
    </div>
  );
}
```

### Hero Component

```tsx
// components/Hero.tsx
import Button from './Button';

interface HeroProps {
  title: string;
  description: string;
}

export default function Hero({ title, description }: HeroProps) {
  return (
    <section className="section pt-20">
      <div className="container">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="heading-1 mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {title}
          </h1>
          <p className="body-large mb-8 max-w-2xl mx-auto">
            {description}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button variant="primary" size="lg">
              Get Started
            </Button>
            <Button variant="outline" size="lg">
              View Examples
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-primary-600 mb-2">0ms</div>
              <div className="text-sm text-gray-600">Runtime Overhead</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary-600 mb-2">5KB</div>
              <div className="text-sm text-gray-600">Min Bundle Size</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary-600 mb-2">200+</div>
              <div className="text-sm text-gray-600">Built-in Rules</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary-600 mb-2">∞</div>
              <div className="text-sm text-gray-600">Customization</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
```

## Advanced Features

### Custom CSS Directives

UnoCSS supports CSS directives when using the transformer:

```css
/* styles/components.css */
.custom-button {
  @apply btn-primary;
  @apply transform hover:scale-105;
  @apply shadow-lg hover:shadow-xl;
}

.card-hover {
  @apply transition-all duration-300;
  @apply hover:shadow-xl hover:-translate-y-1;
}

@screen md {
  .responsive-grid {
    @apply grid-cols-3;
  }
}
```

### Dynamic Class Generation

```tsx
// components/DynamicCard.tsx
interface DynamicCardProps {
  color: 'blue' | 'green' | 'red' | 'purple';
  size: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export default function DynamicCard({ color, size, children }: DynamicCardProps) {
  // UnoCSS will generate these classes on-demand
  const colorClasses = {
    blue: 'bg-blue-500 text-white border-blue-600',
    green: 'bg-green-500 text-white border-green-600',
    red: 'bg-red-500 text-white border-red-600',
    purple: 'bg-purple-500 text-white border-purple-600'
  };

  const sizeClasses = {
    sm: 'p-4 text-sm',
    md: 'p-6 text-base',
    lg: 'p-8 text-lg'
  };

  return (
    <div className={`
      card border-2 
      ${colorClasses[color]} 
      ${sizeClasses[size]}
    `}>
      {children}
    </div>
  );
}
```

### Icon Integration

```tsx
// components/IconButton.tsx
interface IconButtonProps {
  icon: string;
  label: string;
  onClick?: () => void;
}

export default function IconButton({ icon, label, onClick }: IconButtonProps) {
  return (
    <button 
      className="btn-primary flex items-center gap-2"
      onClick={onClick}
    >
      <div className={`${icon} text-lg`} />
      {label}
    </button>
  );
}

// Usage
<IconButton icon="i-carbon-download" label="Download" />
<IconButton icon="i-heroicons-heart" label="Like" />
```

## Production Build

### Build Configuration

```typescript
// scripts/build.ts
import path from 'node:path';
import UnoCSS from 'unocss/vite';
import { build } from 'reactus';

async function buildApp() {
  const cwd = process.cwd();
  const engine = build({
    cwd,
    plugins: [UnoCSS()],
    assetPath: path.join(cwd, 'dist/assets'),
    clientPath: path.join(cwd, 'dist/client'),
    pagePath: path.join(cwd, '.build/pages'),
    cssFiles: [
      'reactus/fouc.css',
      'virtual:uno.css'
    ],
    vite: {
      build: {
        cssCodeSplit: true,
        rollupOptions: {
          output: {
            assetFileNames: (assetInfo) => {
              if (assetInfo.name?.endsWith('.css')) {
                return 'css/[name]-[hash][extname]';
              }
              return 'assets/[name]-[hash][extname]';
            },
          },
        },
      },
    }
  });

  // Register all pages
  await engine.set('@/pages/home');
  await engine.set('@/pages/about');
  await engine.set('@/pages/components');

  console.log('🏗️  Building assets...');
  const assetResults = await engine.buildAllAssets();
  
  console.log('📦 Building client scripts...');
  const clientResults = await engine.buildAllClients();
  
  console.log('🔄 Building server pages...');
  const pageResults = await engine.buildAllPages();

  // Save build manifest
  await engine.save('./dist/manifest.json');

  console.log('✅ Build complete!');
  console.log(`📊 Generated ${assetResults.length} assets`);
  console.log(`📦 Generated ${clientResults.length} client bundles`);
  console.log(`📄 Generated ${pageResults.length} pages`);
}

buildApp().catch(e => {
  console.error('❌ Build failed:', e);
  process.exit(1);
});
```

### Production Server

```typescript
// scripts/start.ts
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import sirv from 'sirv';
import { prod } from 'reactus';

async function start() {
  const cwd = process.cwd();
  
  // Load build manifest
  const manifest = JSON.parse(
    readFileSync(path.join(cwd, 'dist/manifest.json'), 'utf8')
  );

  const engine = prod({
    cwd,
    manifest,
    pagePath: path.join(cwd, '.build/pages')
  });

  // Static file serving
  const assets = sirv(path.join(cwd, 'dist'), {
    maxAge: 31536000, // 1 year
    immutable: true
  });

  const server = createServer(async (req, res) => {
    // Try static files first
    assets(req, res, async () => {
      // Handle dynamic routes
      if (req.url === '/') {
        res.setHeader('Content-Type', 'text/html');
        res.end(await engine.render('@/pages/home', {
          title: 'UnoCSS + Reactus',
          description: 'Production-ready UnoCSS integration'
        }));
        return;
      }

      if (req.url === '/about') {
        res.setHeader('Content-Type', 'text/html');
        res.end(await engine.render('@/pages/about'));
        return;
      }

      res.statusCode = 404;
      res.end('404 Not Found');
    });
  });

  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    console.log(`🚀 Production server running at http://localhost:${port}/`);
  });
}

start().catch(e => {
  console.error('❌ Server failed to start:', e);
  process.exit(1);
});
```

## Troubleshooting

### Common Issues and Solutions

#### 1. UnoCSS Classes Not Generated

**Problem**: Classes appear in your code but styles aren't applied.

**Solutions**:
```typescript
// Ensure UnoCSS plugin is properly configured
import UnoCSS from 'unocss/vite';

const engine = dev({
  plugins: [UnoCSS()], // Make sure this is included
  cssFiles: ['virtual:uno.css'] // Include virtual CSS file
});
```

#### 2. Icons Not Displaying

**Problem**: Icon classes like `i-carbon-home` don't show icons.

**Solutions**:
```bash
# Install icon collections
npm install -D @iconify-json/carbon

# Configure in uno.config.ts
import { presetIcons } from 'unocss'

export default defineConfig({
  presets: [
    presetIcons({
      collections: {
        carbon: () => import('@iconify-json/carbon/icons.json').then(i => i.default)
      }
    })
  ]
})
```

#### 3. Attributify Mode Not Working

**Problem**: Attribute-based utilities aren't being processed.

**Solutions**:
```typescript
// Enable attributify preset
import { presetAttributify } from 'unocss'

export default defineConfig({
  presets: [
    presetAttributify({
      prefix: 'un-', // Optional prefix
      prefixedOnly: false // Allow both prefixed and non-prefixed
    })
  ]
})
```

#### 4. Custom Shortcuts Not Applied

**Problem**: Defined shortcuts in config aren't working.

**Solutions**:
```typescript
// Ensure shortcuts are properly defined
export default defineConfig({
  shortcuts: {
    'btn': 'px-4 py-2 rounded font-medium', // Static shortcut
    'btn-red': 'btn bg-red-500 text-white', // Extending shortcuts
    // Dynamic shortcuts
    [/^btn-(.*)$/, ([, c]) => `btn bg-${c}-500 text-white`]
  }
})
```

#### 5. Build Size Too Large

**Problem**: CSS bundle is larger than expected.

**Solutions**:
```typescript
// Use safelist sparingly and enable purging
export default defineConfig({
  safelist: [
    // Only include essential classes
    'btn-primary'
  ],
  content: {
    // Specify content sources for better purging
    filesystem: [
      'pages/**/*.{tsx,jsx}',
      'components/**/*.{tsx,jsx}'
    ]
  }
})
```

#### 6. Hot Reload Issues

**Problem**: Changes to UnoCSS config don't reflect immediately.

**Solutions**:
```bash
# Restart development server after config changes
npm run dev

# Or use file watching in config
export default defineConfig({
  configDeps: [
    'uno.config.ts'
  ]
})
```

### Performance Tips

1. **Use Shortcuts**: Define commonly used class combinations as shortcuts
2. **Minimize Safelist**: Only include classes that can't be detected statically
3. **Enable CSS Code Splitting**: Split CSS by routes for better loading
4. **Use Transformers**: Enable directives and variant groups for better DX
5. **Optimize Icons**: Only include icon collections you actually use

### IDE Support

#### VS Code Extensions

```json
// .vscode/extensions.json
{
  "recommendations": [
    "antfu.unocss",
    "bradlc.vscode-tailwindcss"
  ]
}
```

#### VS Code Settings

```json
// .vscode/settings.json
{
  "unocss.root": "uno.config.ts",
  "css.validate": false,
  "tailwindCSS.experimental.classRegex": [
    ["class:\\s*?[\"'`]([^\"'`]*).*?[\"'`]", "[\"'`]([^\"'`]*)[\"'`]"]
  ]
}
```

This comprehensive guide covers everything you need to know about integrating UnoCSS with Reactus, from basic setup to advanced production deployment. UnoCSS provides instant on-demand CSS generation that pairs perfectly with Reactus's server-side rendering capabilities, giving you the best of both worlds: fast development with utility-first CSS and optimized production builds.

## Additional Resources

- [UnoCSS Official Documentation](https://unocss.dev/)
- [Reactus Documentation](../README.md)
- [Vite Plugin Documentation](https://vitejs.dev/plugins/)
- [Icon Collections](https://icones.js.org/)
- [UnoCSS Playground](https://unocss.dev/play/)

## Next Steps

1. **Try the Examples**: Start with the basic configuration and gradually add advanced features
2. **Explore Presets**: Experiment with different UnoCSS presets to find what works best for your project
3. **Customize Your Theme**: Define your own design system using the theme configuration
4. **Optimize for Production**: Use the build configuration examples to optimize your CSS for production
5. **Join the Community**: Get help and share your experiences with the UnoCSS and Reactus communities
