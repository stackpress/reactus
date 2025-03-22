console.log('PostCSS config loaded');

export default {
  plugins: {
    // Automatically detects tailwind.config.cjs
    '@tailwindcss/postcss': {}, 
    // Add autoprefixer for compatibility
    autoprefixer: {}
  },
};