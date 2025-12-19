# CSS Framework Integration

This guide shows how to integrate popular CSS frameworks with Reactus, including Tailwind CSS, UnoCSS, and traditional CSS preprocessing. You'll learn how to configure each framework, set up development servers, and create components that leverage the full power of modern CSS tooling.

Understanding CSS framework integration is essential for building modern, responsive applications with Reactus. Each framework offers different advantages and approaches to styling, from utility-first CSS to atomic CSS generation and traditional preprocessing.

 1. [Tailwind CSS Integration](#1-tailwind-css-integration)
 2. [UnoCSS Integration](#2-unocss-integration)
 3. [Sass/SCSS Integration](#3-sassscss-integration)
 4. [CSS Modules Integration](#4-css-modules-integration)
 5. [Production Build Configuration](#5-production-build-configuration)

## 1. Tailwind CSS Integration

Tailwind CSS provides a utility-first approach to styling that works seamlessly with Reactus. This section covers installation, configuration, and usage patterns for building responsive, modern interfaces with Tailwind's comprehensive utility classes.

### 1.1. Installation and Configuration

Install Tailwind CSS and its dependencies, then configure it for use with Reactus. The configuration includes content paths for proper purging and PostCSS setup for processing.

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**Tailwind Configuration**

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a8a',
        }
      }
    },
  },
  plugins: [],
}
```

**CSS File Setup**

```css
/* tailwind.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components {
  .btn {
    @apply px-4 py-2 rounded-lg font-medium transition-colors;
  }
  
  .btn-primary {
    @apply bg-primary-500 text-white hover:bg-primary-600;
  }
  
  .btn-secondary {
    @apply bg-gray-200 text-gray-900 hover:bg-gray-300;
  }
}
```

### 1.2. Development Server Setup

Configure your development server to process Tailwind CSS through PostCSS. This setup enables hot reloading and automatic CSS generation during development.

```typescript
// scripts/develop.ts
import { dev } from 'reactus';
import express from 'express';

async function develop() {
  const engine = dev({
    cwd: process.cwd(),
    basePath: '/',
    clientRoute: '/client',
    cssFiles: ['tailwind.css'], // Include Tailwind CSS
    vite: {
      css: {
        postcss: {
          plugins: [
            require('tailwindcss'),
            require('autoprefixer'),
          ],
        },
      },
    },
  });

  const app = express();

  // Handle assets and HMR
  app.use(async (req, res, next) => {
    await engine.http(req, res);
    if (res.headersSent) return;
    next();
  });

  // Routes
  app.get('/', async (req, res) => {
    const html = await engine.render('@/pages/home', {
      title: 'Tailwind + Reactus'
    });
    res.setHeader('Content-Type', 'text/html');
    res.end(html);
  });

  app.listen(3000, () => {
    console.log('Server running at http://localhost:3000');
  });
}

develop().catch(console.error);
```

### 1.3. Component Implementation

Create React components that leverage Tailwind's utility classes for responsive design and interactive elements. This example demonstrates common patterns and best practices.

```tsx
// pages/home.tsx
export function Head() {
  return (
    <>
      <title>Tailwind + Reactus</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </>
  );
}

export default function HomePage({ title }: { title: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            {title}
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Beautiful, responsive design with Tailwind CSS and Reactus
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="btn btn-primary">
              Get Started
            </button>
            <button className="btn btn-secondary">
              Learn More
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <FeatureCard
            title="Fast Development"
            description="Build quickly with utility-first CSS"
            icon="⚡"
          />
          <FeatureCard
            title="Responsive Design"
            description="Mobile-first responsive design out of the box"
            icon="📱"
          />
          <FeatureCard
            title="Customizable"
            description="Easily customize with your design system"
            icon="🎨"
          />
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ title, description, icon }: {
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
```

## 2. UnoCSS Integration

UnoCSS provides instant on-demand atomic CSS generation with a highly configurable preset system. This section covers setup, configuration, and usage patterns for building applications with UnoCSS's atomic approach.

### 2.1. Installation and Configuration

Install UnoCSS and configure it with presets for utility classes, attributify mode, and icon support. The configuration allows for extensive customization of the generated CSS.

```bash
npm install -D unocss @unocss/vite
```

**UnoCSS Configuration**

```typescript
// uno.config.ts
import { defineConfig, presetUno, presetAttributify, presetIcons } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({
      collections: {
        carbon: () => import('@iconify-json/carbon/icons.json').then(i => i.default),
      }
    }),
  ],
  theme: {
    colors: {
      primary: {
        50: '#eff6ff',
        500: '#3b82f6',
        900: '#1e3a8a',
      }
    }
  },
  shortcuts: {
    'btn': 'px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer',
    'btn-primary': 'btn bg-primary-500 text-white hover:bg-primary-600',
    'btn-secondary': 'btn bg-gray-200 text-gray-900 hover:bg-gray-300',
  }
})
```

### 2.2. Development Server Setup

Configure the development server to use UnoCSS with Vite integration. This setup enables instant CSS generation and hot reloading during development.

```typescript
// scripts/develop.ts
import { dev } from 'reactus';
import express from 'express';
import UnoCSS from '@unocss/vite';

async function develop() {
  const engine = dev({
    cwd: process.cwd(),
    basePath: '/',
    clientRoute: '/client',
    vite: {
      plugins: [
        UnoCSS(),
      ],
    },
  });

  const app = express();

  // Handle assets and HMR
  app.use(async (req, res, next) => {
    await engine.http(req, res);
    if (res.headersSent) return;
    next();
  });

  // Routes
  app.get('/', async (req, res) => {
    const html = await engine.render('@/pages/home', {
      title: 'UnoCSS + Reactus'
    });
    res.setHeader('Content-Type', 'text/html');
    res.end(html);
  });

  app.listen(3000, () => {
    console.log('Server running at http://localhost:3000');
  });
}

develop().catch(console.error);
```

### 2.3. Component Implementation

Create components using UnoCSS utilities and shortcuts. This example demonstrates the atomic CSS approach and icon integration.

```tsx
// pages/home.tsx
import 'uno.css';

export function Head() {
  return (
    <>
      <title>UnoCSS + Reactus</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </>
  );
}

export default function HomePage({ title }: { title: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            {title}
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Instant on-demand atomic CSS with UnoCSS and Reactus
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="btn-primary">
              Get Started
            </button>
            <button className="btn-secondary">
              Learn More
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="i-carbon-flash text-4xl mb-4 text-primary-500"></div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Instant</h3>
            <p className="text-gray-600">On-demand CSS generation</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="i-carbon-mobile text-4xl mb-4 text-primary-500"></div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Responsive</h3>
            <p className="text-gray-600">Mobile-first design utilities</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="i-carbon-settings text-4xl mb-4 text-primary-500"></div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Configurable</h3>
            <p className="text-gray-600">Highly customizable presets</p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

## 3. Sass/SCSS Integration

Sass provides powerful features like variables, mixins, and functions for maintainable CSS. This section covers setup, configuration, and best practices for using Sass with Reactus.

### 3.1. Installation and Configuration

Install Sass and configure it for use with Reactus. The setup includes variable definitions, mixins, and component styles organized in a maintainable structure.

```bash
npm install -D sass
```

**Sass Configuration**

```scss
// styles/main.scss
$primary-color: #3b82f6;
$secondary-color: #6b7280;
$border-radius: 0.5rem;
$transition: all 0.2s ease-in-out;

// Mixins
@mixin button-base {
  padding: 0.5rem 1rem;
  border-radius: $border-radius;
  font-weight: 500;
  transition: $transition;
  cursor: pointer;
  border: none;
  
  &:hover {
    transform: translateY(-1px);
  }
}

@mixin button-variant($bg-color, $text-color, $hover-color) {
  @include button-base;
  background-color: $bg-color;
  color: $text-color;
  
  &:hover {
    background-color: $hover-color;
  }
}

// Components
.btn {
  @include button-base;
  
  &--primary {
    @include button-variant($primary-color, white, darken($primary-color, 10%));
  }
  
  &--secondary {
    @include button-variant($secondary-color, white, darken($secondary-color, 10%));
  }
}

.card {
  background: white;
  border-radius: $border-radius;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  transition: $transition;
  
  &:hover {
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  }
  
  &__title {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: #1f2937;
  }
  
  &__content {
    color: #6b7280;
    line-height: 1.6;
  }
}

// Layout
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.grid {
  display: grid;
  gap: 2rem;
  
  &--3-cols {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }
}

// Responsive
@media (max-width: 768px) {
  .grid--3-cols {
    grid-template-columns: 1fr;
  }
}
```

### 3.2. Development Server Setup

Configure the development server to process Sass files with additional data injection for global variables and mixins.

```typescript
// scripts/develop.ts
import { dev } from 'reactus';
import express from 'express';

async function develop() {
  const engine = dev({
    cwd: process.cwd(),
    basePath: '/',
    clientRoute: '/client',
    cssFiles: ['styles/main.scss'], // Include Sass file
    vite: {
      css: {
        preprocessorOptions: {
          scss: {
            additionalData: `@import "./styles/variables.scss";`
          }
        }
      }
    }
  });

  const app = express();

  // Handle assets and HMR
  app.use(async (req, res, next) => {
    await engine.http(req, res);
    if (res.headersSent) return;
    next();
  });

  // Routes
  app.get('/', async (req, res) => {
    const html = await engine.render('@/pages/home', {
      title: 'Sass + Reactus'
    });
    res.setHeader('Content-Type', 'text/html');
    res.end(html);
  });

  app.listen(3000, () => {
    console.log('Server running at http://localhost:3000');
  });
}

develop().catch(console.error);
```

### 3.3. Component Implementation

Create components that use Sass-generated CSS classes and demonstrate the power of preprocessed CSS with variables and mixins.

```tsx
// pages/home.tsx
import '../styles/main.scss';

export function Head() {
  return (
    <>
      <title>Sass + Reactus</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </>
  );
}

export default function HomePage({ title }: { title: string }) {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)' }}>
      <div className="container" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937' }}>
            {title}
          </h1>
          <p style={{ fontSize: '1.25rem', color: '#6b7280', marginBottom: '2rem' }}>
            Powerful styling with Sass and Reactus
          </p>
          
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn--primary">
              Get Started
            </button>
            <button className="btn btn--secondary">
              Learn More
            </button>
          </div>
        </div>

        <div className="grid grid--3-cols">
          <div className="card">
            <h3 className="card__title">🎨 Powerful Styling</h3>
            <p className="card__content">
              Use variables, mixins, and functions for maintainable CSS
            </p>
          </div>
          
          <div className="card">
            <h3 className="card__title">📦 Modular</h3>
            <p className="card__content">
              Organize your styles with partials and imports
            </p>
          </div>
          
          <div className="card">
            <h3 className="card__title">⚡ Fast</h3>
            <p className="card__content">
              Compiled CSS with Vite's fast build system
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

## 4. CSS Modules Integration

CSS Modules provide scoped CSS with automatic class name generation to prevent style conflicts. This section covers setup, usage patterns, and best practices for component-scoped styling.

### 4.1. CSS Modules Setup

CSS Modules work out of the box with Vite and Reactus. Create modular CSS files with the `.module.css` extension for automatic scoping.

```css
/* components/Button.module.css */
.button {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 500;
  transition: all 0.2s ease-in-out;
  cursor: pointer;
  border: none;
}

.primary {
  composes: button;
  background-color: #3b82f6;
  color: white;
}

.primary:hover {
  background-color: #2563eb;
}

.secondary {
  composes: button;
  background-color: #6b7280;
  color: white;
}

.secondary:hover {
  background-color: #4b5563;
}

.large {
  padding: 0.75rem 1.5rem;
  font-size: 1.125rem;
}
```

### 4.2. Component Implementation

Create reusable components that leverage CSS Modules for scoped styling and composition patterns.

```tsx
// components/Button.tsx
import styles from './Button.module.css';

interface ButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'normal' | 'large';
  children: React.ReactNode;
  onClick?: () => void;
}

export default function Button({ 
  variant = 'primary', 
  size = 'normal', 
  children, 
  onClick 
}: ButtonProps) {
  const className = [
    styles[variant],
    size === 'large' && styles.large
  ].filter(Boolean).join(' ');

  return (
    <button className={className} onClick={onClick}>
      {children}
    </button>
  );
}
```

### 4.3. Page Implementation

Use CSS Modules in page components for scoped styling that doesn't conflict with other components or global styles.

```tsx
// pages/home.tsx
import Button from '../components/Button';
import styles from './home.module.css';

export function Head() {
  return (
    <>
      <title>CSS Modules + Reactus</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </>
  );
}

export default function HomePage({ title }: { title: string }) {
  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.subtitle}>
          Scoped CSS with CSS Modules and Reactus
        </p>
        
        <div className={styles.buttons}>
          <Button variant="primary" size="large">
            Get Started
          </Button>
          <Button variant="secondary" size="large">
            Learn More
          </Button>
        </div>
      </div>
    </div>
  );
}
```

```css
/* pages/home.module.css */
.container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero {
  text-align: center;
  max-width: 800px;
  padding: 2rem;
}

.title {
  font-size: 3rem;
  font-weight: bold;
  margin-bottom: 1rem;
  color: #1f2937;
}

.subtitle {
  font-size: 1.25rem;
  color: #6b7280;
  margin-bottom: 2rem;
}

.buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .title {
    font-size: 2rem;
  }
  
  .buttons {
    flex-direction: column;
    align-items: center;
  }
}
```

## 5. Production Build Configuration

Configure production builds to optimize CSS frameworks for deployment. This section covers build optimization, CSS splitting, and asset management for different CSS approaches.

### 5.1. Build Configuration

Configure the build process to optimize CSS frameworks for production deployment with proper minification and asset organization.

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
    cssFiles: ['tailwind.css'], // or ['styles/main.scss'] for Sass
    vite: {
      css: {
        postcss: {
          plugins: [
            require('tailwindcss'),
            require('autoprefixer'),
          ],
        },
      },
      build: {
        cssCodeSplit: true, // Split CSS for better caching
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
    },
  });

  // Find and build all pages
  const pageFiles = await glob('./pages/**/*.{tsx,jsx}');
  
  for (const file of pageFiles) {
    const entry = '@/' + path.relative(process.cwd(), file);
    await builder.set(entry);
  }

  console.log(`Building ${pageFiles.length} pages with CSS framework...`);

  await builder.buildAllAssets();
  await builder.buildAllClients();
  await builder.buildAllPages();

  await builder.save('./dist/manifest.json');
  console.log('Build complete with optimized CSS!');
}

buildApp().catch(console.error);
```

### 5.2. Framework-Specific Optimizations

Each CSS framework benefits from specific optimization strategies during the build process. Configure these optimizations based on your chosen framework.

**Tailwind CSS Optimization**

 - Enable purging to remove unused CSS classes
 - Configure content paths for accurate detection
 - Use JIT mode for faster builds
 - Enable CSS minification and compression

**UnoCSS Optimization**

 - Configure presets for optimal bundle size
 - Use shortcuts for common patterns
 - Enable tree-shaking for unused utilities
 - Optimize icon collections for used icons only

**Sass/SCSS Optimization**

 - Use CSS modules for component scoping
 - Configure source maps for debugging
 - Enable CSS compression and minification
 - Optimize import paths and dependencies
